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
import {
  assertNever,
  delaySeconds,
  promiseAndResolve,
  propSetterAction,
} from "../../utils";
import { NavigationAbandonmentGuard } from "../../navigation-abandonment-guard";

type UserSettleResult = "cancel" | "submit";
type UserSettleFun = (result: UserSettleResult) => void;
type UserAckFun = () => void;

type InteractingAsyncUserFlowFsmState<RunStateT> = {
  kind: "interacting";
  maybeLastFailure: Error | null;
  runState: RunStateT;
  userSettle: UserSettleFun;
};

export type ActiveAsyncUserFlowFsmState<RunStateT, AttemptOutcomeNubT> =
  | InteractingAsyncUserFlowFsmState<RunStateT>
  | { kind: "attempting"; runState: RunStateT }
  | {
      kind: "awaiting-ack-of-notification";
      runState: RunStateT;
      outcomeNub: AttemptOutcomeNubT;
      userAck: UserAckFun;
    };

export type AsyncUserFlowFsmState<RunStateT, AttemptOutcomeNubT> =
  | { kind: "idle" }
  | { kind: "preparing" }
  | ActiveAsyncUserFlowFsmState<RunStateT, AttemptOutcomeNubT>;

export type RunOutcome =
  | "error"
  | "abandoned-by-navigation"
  | "cancelled-by-user"
  | "succeeded";

/** Whether the given `runOutcome` indicates that the user settled the
 * flow, either by cancelling or submitting.  (In contrast to
 * abandoning the flow by navigating forward/backward, or encountering
 * an unhandled error.) */
export function flowWasSettledByUser(runOutcome: RunOutcome): boolean {
  switch (runOutcome) {
    case "error":
    case "abandoned-by-navigation":
      return false;
    case "cancelled-by-user":
    case "succeeded":
      return true;
    default:
      return assertNever(runOutcome);
  }
}

function assertInteracting<RunStateT>(
  fsmState: AsyncUserFlowFsmState<RunStateT, unknown>
): asserts fsmState is InteractingAsyncUserFlowFsmState<RunStateT> {
  if (fsmState.kind !== "interacting")
    throw new Error('FSM-state should be "interacting"');
}

export type AsyncUserFlowOnDisposeFun = (runOutcome: RunOutcome) => void;

type AugRunArgs<RunArgsT> = RunArgsT & {
  onDispose?: AsyncUserFlowOnDisposeFun;
};

export type AsyncUserFlowState<RunStateT, AttemptOutcomeNubT> = {
  fsmState: Generic<AsyncUserFlowFsmState<RunStateT, AttemptOutcomeNubT>>;
  isSubmittable: Computed<
    AsyncUserFlowState<RunStateT, AttemptOutcomeNubT>,
    boolean
  >;
};

/** Type describing state and actions for an async user flow.  The type
 * params are:
 *
 * * `AppModelT`: the type of the overall app model
 * * `RunArgsT`: the type describing the arguments (bundled into one
 *   object) which are needed to initiate the flow.
 * * `RunStateT`: the type describing the state of the flow as the user
 *   interacts with it
 * * `AttemptOutcomeNubT`: the type describing the `nub` prop of the
 *   outcome of the `attempt()` call (optional, default `void`) */
export type AsyncUserFlowSlice<
  AppModelT extends object,
  RunArgsT,
  RunStateT,
  AttemptOutcomeNubT = void,
> = AsyncUserFlowState<RunStateT, AttemptOutcomeNubT> & {
  setFsmState: Action<
    AsyncUserFlowState<RunStateT, AttemptOutcomeNubT>,
    AsyncUserFlowFsmState<RunStateT, AttemptOutcomeNubT>
  >;
  run: Thunk<
    AsyncUserFlowSlice<AppModelT, RunArgsT, RunStateT, AttemptOutcomeNubT>,
    AugRunArgs<RunArgsT>,
    void,
    AppModelT
  >;
};

type AsyncFlowPrepareFun<RunArgsT, AppModelT extends object, RunStateT> = (
  args: RunArgsT,
  storeActions: Actions<AppModelT>,
  navigationGuard: NavigationAbandonmentGuard
) => Promise<RunStateT>;

type AsyncFlowAttemptFun<
  RunStateT,
  AppModelT extends object,
  AttemptOutcomeT,
> = (
  runState: RunStateT,
  storeActions: Actions<AppModelT>,
  navigationGuard: NavigationAbandonmentGuard
) => Promise<AttemptOutcomeT>;

export type AsyncUserFlowOptions = {
  pulseSuccessMessage: boolean;
};

const kDefaultAsyncUserFlowOptions: AsyncUserFlowOptions = {
  pulseSuccessMessage: true,
};

export type AttemptOutcome<NubT> = {
  needsModalNotification: boolean;
  nub: NubT;
};

type AsyncUserFlowSliceFuncs<
  AppModelT extends object,
  RunArgsT,
  RunStateT,
  AttemptOutcomeNubT,
> = {
  prepare: AsyncFlowPrepareFun<RunArgsT, AppModelT, RunStateT>;
  isSubmittable: (runState: RunStateT) => boolean;
  attempt: AsyncFlowAttemptFun<
    RunStateT,
    AppModelT,
    AttemptOutcome<AttemptOutcomeNubT>
  >;
};

function baseAsyncUserFlowSlice<
  AppModelT extends object,
  RunArgsT,
  RunStateT,
  AttemptOutcomeNubT,
>(
  prepare: AsyncFlowPrepareFun<RunArgsT, AppModelT, RunStateT>,
  isSubmittable: (runState: RunStateT) => boolean,
  attempt: AsyncFlowAttemptFun<
    RunStateT,
    AppModelT,
    AttemptOutcome<AttemptOutcomeNubT>
  >,
  options: AsyncUserFlowOptions
): AsyncUserFlowSlice<AppModelT, RunArgsT, RunStateT, AttemptOutcomeNubT> {
  return {
    fsmState: generic({ kind: "idle" }),
    isSubmittable: computed((state) => {
      const fsmState = state.fsmState;
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

      let runOutcome: RunOutcome = "error";

      // For some flows, RunArgsT = void, and then the run() action is
      // called with no arguments, meaning args is undefined.  So we
      // have to check that args is non-undefined, as well as that it
      // has an "onDispose" property.
      const onDispose = (args && args.onDispose) ?? (() => void 0);

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
            runOutcome = "cancelled-by-user";
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

            // TODO: Replace once control flow redesigned.
            // actions.setFsmState({ kind: "succeeded", runState });
            runOutcome = "succeeded";

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
        if (navigationGuard.wasAbandoned(err)) {
          runOutcome = "abandoned-by-navigation";
        } else {
          // Shouldn't happen.
          runOutcome = "error";
          throw err;
        }
      } finally {
        actions.setFsmState({ kind: "idle" });
        navigationGuard.exit();
        onDispose(runOutcome);
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
      `navigationGuard`.  The `attempt()` function should return an
      object of an "outcome" type.  Its `needsModalNotification` prop
      says whether the user should be presented with a modal
      notification.  This should be used for anticipated errors.  If the
      outcome was that the operation was fully successfully performed, a
      notification should _not_ be requested with this prop.  The
      `outcomeNub` prop contains any further details needed to present
      the notification to the user, or to construct the "toast" which
      lets the user know, unobtrusively, that the operation succeeded,
      at least in part.
*/
// TODO: If SpecificSliceT is always a collection of Actions, rename
// type param to sth like SpecificActions.
export function asyncUserFlowSlice<
  AppModelT extends object,
  SpecificSliceT,
  RunArgsT,
  RunStateT,
  AttemptOutcomeNubT,
>(
  specificSlice: SpecificSliceT,
  prepare: AsyncFlowPrepareFun<RunArgsT, AppModelT, RunStateT>,
  isSubmittable: (runState: RunStateT) => boolean,
  attempt: AsyncFlowAttemptFun<
    RunStateT,
    AppModelT,
    AttemptOutcome<AttemptOutcomeNubT>
  >,
  options: Partial<AsyncUserFlowOptions> = kDefaultAsyncUserFlowOptions
): SpecificSliceT &
  AsyncUserFlowSlice<AppModelT, RunArgsT, RunStateT, AttemptOutcomeNubT> {
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

export function isInteractable<RunStateT>(
  fsmState: AsyncUserFlowFsmState<RunStateT, unknown>
): boolean {
  return fsmState.kind === "interacting";
}

export function isActive<RunStateT>(
  fsmState: AsyncUserFlowFsmState<RunStateT, unknown>
): fsmState is ActiveAsyncUserFlowFsmState<RunStateT, unknown> {
  return (
    fsmState.kind === "interacting" ||
    fsmState.kind === "attempting" ||
    fsmState.kind === "awaiting-ack-of-notification"
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
  fsmState: AsyncUserFlowFsmState<RunStateT, unknown>
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
  fsmState: AsyncUserFlowFsmState<RunStateT, unknown>
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

export function runStateAction<RunStateT, PayloadT, AttemptOutcomeNubT>(
  actionFun: RunStateAction<RunStateT, PayloadT>
) {
  return action<AsyncUserFlowState<RunStateT, AttemptOutcomeNubT>, PayloadT>(
    (state, payload) => {
      const fsmState = state.fsmState;
      assertInteracting(fsmState);
      actionFun(fsmState.runState, payload);
    }
  );
}

export function setRunStateProp<
  RunStateT,
  PropNameT extends keyof RunStateT,
  AttemptOutcomeNubT,
>(propName: PropNameT) {
  return action<
    AsyncUserFlowState<RunStateT, AttemptOutcomeNubT>,
    NonNullable<RunStateT[PropNameT]>
  >((state, val) => {
    const fsmState = state.fsmState;
    assertInteracting(fsmState);
    fsmState.runState[propName] = val;
  });
}

////////////////////////////////////////////////////////////////////////
// Helpers for simple attempt() functions

export type VoidOutcome = AttemptOutcome<void>;

export const noModalWithVoid: VoidOutcome = {
  needsModalNotification: false,
  nub: void 0,
};

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

export async function emptyAttempt(): Promise<VoidOutcome> {
  return noModalWithVoid;
}
