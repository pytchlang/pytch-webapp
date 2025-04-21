import {
  Actions,
  Action,
  action,
  Thunk,
  thunk,
  Computed,
  computed,
  Generic,
  generic,
} from "easy-peasy";
import { delaySeconds, promiseAndResolve, propSetterAction } from "../../utils";
import { NavigationAbandonmentGuard } from "../../navigation-abandonment-guard";

type UserSettleResult = "cancel" | "submit";
type UserSettleFun = (result: UserSettleResult) => void;

type InteractingAsyncUserFlowFsmState<RunStateT> = {
  kind: "interacting";
  maybeLastFailure: Error | null;
  runState: RunStateT;
  userSettle: UserSettleFun;
};

export type ActiveAsyncUserFlowFsmState<RunStateT> =
  | InteractingAsyncUserFlowFsmState<RunStateT>
  | { kind: "attempting"; runState: RunStateT }
  | { kind: "succeeded"; runState: RunStateT };

export type AsyncUserFlowFsmState<RunStateT> =
  | { kind: "idle" }
  | { kind: "preparing" }
  | ActiveAsyncUserFlowFsmState<RunStateT>;

export type RunOutcome =
  | "error"
  | "abandoned-by-navigation"
  | "cancelled-by-user"
  | "succeeded";

function assertInteracting<RunStateT>(
  fsmState: AsyncUserFlowFsmState<RunStateT>
): asserts fsmState is InteractingAsyncUserFlowFsmState<RunStateT> {
  if (fsmState.kind !== "interacting")
    throw new Error('FSM-state should be "interacting"');
}

export type AsyncUserFlowState<RunStateT> = {
  fsmState: Generic<AsyncUserFlowFsmState<RunStateT>>;
  isSubmittable: Computed<AsyncUserFlowState<RunStateT>, boolean>;
};

export type AsyncUserFlowSlice<
  AppModelT extends object,
  RunArgsT,
  RunStateT,
> = AsyncUserFlowState<RunStateT> & {
  setFsmState: Action<
    AsyncUserFlowState<RunStateT>,
    AsyncUserFlowFsmState<RunStateT>
  >;
  run: Thunk<
    AsyncUserFlowSlice<AppModelT, RunArgsT, RunStateT>,
    RunArgsT,
    void,
    AppModelT
  >;
};

type AsyncFlowPrepareFun<RunArgsT, AppModelT extends object, RunStateT> = (
  args: RunArgsT,
  storeActions: Actions<AppModelT>,
  navigationGuard: NavigationAbandonmentGuard
) => Promise<RunStateT>;

type AsyncFlowAttemptFun<RunStateT, AppModelT extends object> = (
  runState: RunStateT,
  storeActions: Actions<AppModelT>,
  navigationGuard: NavigationAbandonmentGuard
) => Promise<void>;

export type AsyncUserFlowOptions = {
  pulseSuccessMessage: boolean;
};

const kDefaultAsyncUserFlowOptions: AsyncUserFlowOptions = {
  pulseSuccessMessage: true,
};

function baseAsyncUserFlowSlice<AppModelT extends object, RunArgsT, RunStateT>(
  prepare: AsyncFlowPrepareFun<RunArgsT, AppModelT, RunStateT>,
  isSubmittable: (runState: RunStateT) => boolean,
  attempt: AsyncFlowAttemptFun<RunStateT, AppModelT>,
  options: AsyncUserFlowOptions
): AsyncUserFlowSlice<AppModelT, RunArgsT, RunStateT> {
  return {
    fsmState: generic({ kind: "idle" }),
    isSubmittable: computed((state) => {
      const fsmState = state.fsmState as AsyncUserFlowFsmState<RunStateT>;
      return (
        fsmState.kind === "interacting" && isSubmittable(fsmState.runState)
      );
    }),

    setFsmState: propSetterAction("fsmState"),

    run: thunk(async (actions, args, helpers) => {
      const fsmStateKind = helpers.getState().fsmState.kind;
      if (fsmStateKind !== "idle") {
        console.log(
          `AsyncUserFlowSlice.run(): expecting FSM to be in state "idle"` +
            ` but is in state "${fsmStateKind}"`
        );
        return;
      }

      const storeActions = helpers.getStoreActions();

      const navigationGuard = new NavigationAbandonmentGuard();
      const throwIfAbandoned =
        navigationGuard.throwIfAbandoned.bind(navigationGuard);

      try {
        actions.setFsmState({ kind: "preparing" });

        let runState: RunStateT = await throwIfAbandoned(
          prepare(args, storeActions, navigationGuard)
        );

        let maybeLastFailure: Error | null = null;

        let hasSucceeded = false;
        while (!hasSucceeded) {
          const { promise: userSettlePromise, resolve: userSettle } =
            promiseAndResolve<UserSettleResult>();

          actions.setFsmState({
            kind: "interacting",
            maybeLastFailure,
            runState,
            userSettle,
          });

          const settleResult = await throwIfAbandoned(userSettlePromise);
          if (settleResult === "cancel") {
            return;
          }

          try {
            const fsmState = helpers.getState().fsmState;

            assertInteracting(fsmState);
            runState = fsmState.runState;

            actions.setFsmState({ kind: "attempting", runState });

            // The promise returned from this attempt() call can reject
            // (a "business logic" error, or by back/fwd abandonment).
            await throwIfAbandoned(
              attempt(runState, storeActions, navigationGuard)
            );

            actions.setFsmState({ kind: "succeeded", runState });

            if (options.pulseSuccessMessage) {
              await throwIfAbandoned(delaySeconds(1.0));
            }

            hasSucceeded = true;
          } catch (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            err: any
          ) {
            // If the error is because of user navigation abandonment,
            // we will loop back to "interacting", and the "error" will
            // be picked up again there, so we need not treat user
            // navigation abandonment specially.
            maybeLastFailure = err;
          }
        }
      } catch (err) {
        if (!navigationGuard.wasAbandoned(err)) {
          throw err;
        }
      } finally {
        actions.setFsmState({ kind: "idle" });
        navigationGuard.exit();
      }
    }),
  };
}

/** Construct a model slice for managing an asynchronous user flow which
    can be abandoned if the user navigates backward/forward in the
    browser. The flow is described in terms of any flow-specific
    actions, its "prepare" phase, its "attempt" phase, a predicate
    saying whether the "attempt" action is currently permissible, and
    the relevant types.  This information should be provided in the
    following arguments:

    - `specificSlice` — Object containing `Action`s relevant for
      mutating the flow's run-state (usually as a result of user
      actions, for example typing into an input box).

    - `prepare()` — Run at the start of the flow.  Its job is to convert
      the "run arguments" (which should be convenient for the caller of
      `run()` to construct) into "run state" (which can transform those
      arguments to make them more convenient for the flow logic).  The
      flow's `prepare()` function is given arguments:

      - `runArgs` — The arguments (bundled into a single object) which
        were given to the top-level `run()` thunk.

      - `storeActions` — The top-level store actions.

      - `navigationGuard` — If the `prepare()` function uses `await`, it
        should wrap the awaited promise using
        `navigationGuard.throwIfAbandoned()` and let any "abandoned"
        error escape to the caller.

      A `prepare()` function might not need `storeActions` or
      `navigationGuard`.

    - `isSubmittable()` — Predicate computing whether the action of the
      flow can be attempted, based on the run-state of the flow.  For
      example, a filename might need to be non-empty.

    - `attempt()` — Run to attempt the action of the flow based on the
      current run-state.  The `attempt()` function is given arguments:

      - `runState` — The run-state of the interaction.

      - `storeActions` — The top-level store actions.

      - `navigationGuard` — If the `attempt()` function uses `await`, it
        should wrap the awaited promise using
        `navigationGuard.throwIfAbandoned()` and let any "abandoned"
        error escape to the caller.

      An `attempt()` function might not need `storeActions` or
      `navigationGuard`.
*/
// TODO: If SpecificSliceT is always a collection of Actions, rename
// type param to sth like SpecificActions.
export function asyncUserFlowSlice<
  AppModelT extends object,
  SpecificSliceT,
  RunArgsT,
  RunStateT,
>(
  specificSlice: SpecificSliceT,
  prepare: AsyncFlowPrepareFun<RunArgsT, AppModelT, RunStateT>,
  isSubmittable: (runState: RunStateT) => boolean,
  attempt: AsyncFlowAttemptFun<RunStateT, AppModelT>,
  options: Partial<AsyncUserFlowOptions> = kDefaultAsyncUserFlowOptions
): SpecificSliceT & AsyncUserFlowSlice<AppModelT, RunArgsT, RunStateT> {
  const effectiveOptions: AsyncUserFlowOptions = Object.assign(
    {},
    kDefaultAsyncUserFlowOptions,
    options
  );
  const asyncFlowModelSlice = baseAsyncUserFlowSlice(
    prepare,
    isSubmittable,
    attempt,
    effectiveOptions
  );
  return Object.assign({}, specificSlice, asyncFlowModelSlice);
}

////////////////////////////////////////////////////////////////////////
// Helpers for extracting properties of fsmState

// TODO: Would it be cleaner for these to be computed properties on the
// slice, sibling to isSubmittable?

export function isSucceeded<RunStateT>(
  fsmState: AsyncUserFlowFsmState<RunStateT>
): boolean {
  return fsmState.kind === "succeeded";
}

export function maybeLastFailureMessage<RunStateT>(
  fsmState: AsyncUserFlowFsmState<RunStateT>
): string | null {
  return fsmState.kind === "interacting" && fsmState.maybeLastFailure != null
    ? fsmState.maybeLastFailure.message ?? "an unknown error occurred"
    : null;
}

export function isInteractable<RunStateT>(
  fsmState: AsyncUserFlowFsmState<RunStateT>
): boolean {
  return fsmState.kind === "interacting";
}

export function isActive<RunStateT>(
  fsmState: AsyncUserFlowFsmState<RunStateT>
): fsmState is ActiveAsyncUserFlowFsmState<RunStateT> {
  return (
    fsmState.kind === "interacting" ||
    fsmState.kind === "attempting" ||
    fsmState.kind === "succeeded"
  );
}

////////////////////////////////////////////////////////////////////////
// Helpers for settling (cancelling or submitting) the modal

type SettleFunctions = {
  cancel: () => void;
  submit: () => void;
};

export function settleFunctions<RunStateT>(
  isSubmittable: boolean,
  fsmState: AsyncUserFlowFsmState<RunStateT>
): SettleFunctions {
  return fsmState.kind === "interacting"
    ? {
        cancel: () => fsmState.userSettle("cancel"),
        submit: () => {
          if (isSubmittable) {
            fsmState.userSettle("submit");
          }
        },
      }
    : {
        cancel: () => void 0,
        submit: () => void 0,
      };
}

////////////////////////////////////////////////////////////////////////
// Helper for passing to useEffect() to give focus to an input element

export function flowFocusOrBlurFun<Elt extends HTMLElement, RunStateT>(
  elementRef: React.RefObject<Elt>,
  fsmState: AsyncUserFlowFsmState<RunStateT>
) {
  return () => {
    if (!isActive(fsmState)) {
      return;
    }

    const element = elementRef.current;
    if (element == null) {
      // Shouldn't happen.
      return;
    }

    if (isInteractable(fsmState)) {
      element.focus();
    } else {
      element.blur();
    }
  };
}

////////////////////////////////////////////////////////////////////////
// Helpers for writing actions which operate on the RunStateT

type RunStateAction<RunStateT, PayloadT> = (
  runState: RunStateT,
  payload: PayloadT
) => void;

export function runStateAction<RunStateT, PayloadT>(
  actionFun: RunStateAction<RunStateT, PayloadT>
) {
  return action<AsyncUserFlowState<RunStateT>, PayloadT>((state, payload) => {
    const fsmState_ = state.fsmState;
    const fsmState = fsmState_ as AsyncUserFlowFsmState<RunStateT>;

    assertInteracting(fsmState);
    actionFun(fsmState.runState, payload);
  });
}

export function setRunStateProp<RunStateT, PropNameT extends keyof RunStateT>(
  propName: PropNameT
) {
  return action<
    AsyncUserFlowState<RunStateT>,
    NonNullable<RunStateT[PropNameT]>
  >((state, val) => {
    const fsmState_ = state.fsmState;
    const fsmState = fsmState_ as AsyncUserFlowFsmState<RunStateT>;

    assertInteracting(fsmState);
    fsmState.runState[propName] = val;
  });
}

////////////////////////////////////////////////////////////////////////
// Helpers for very simple flows

export async function idPrepare<ArgsAndStateT>(
  args: ArgsAndStateT
): Promise<ArgsAndStateT> {
  return args;
}

export function alwaysSubmittable(): boolean {
  return true;
}

export async function emptyAttempt(): Promise<void> {
  return;
}
