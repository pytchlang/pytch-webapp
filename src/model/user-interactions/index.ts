import {
  Action,
  action,
  Actions,
  Computed,
  computed,
  Thunk,
  thunk,
} from "easy-peasy";
import { IPytchAppModel } from "..";
import { delaySeconds } from "../../utils";

export type InteractionProgress =
  | { status: "not-happening" }
  | { status: "not-tried-yet" }
  | { status: "trying" }
  | { status: "succeeded" }
  | { status: "failed"; message: string };

export interface IModalUserInteraction<TaskDescriptor> {
  progress: InteractionProgress;
  inputsReady: boolean;

  isActive: Computed<IModalUserInteraction<TaskDescriptor>, boolean>;
  isInteractable: Computed<IModalUserInteraction<TaskDescriptor>, boolean>;
  attemptSucceeded: Computed<IModalUserInteraction<TaskDescriptor>, boolean>;
  maybeLastFailureMessage: Computed<
    IModalUserInteraction<TaskDescriptor>,
    string | null
  >;

  dismiss: Thunk<IModalUserInteraction<TaskDescriptor>>;
  attempt: Thunk<
    IModalUserInteraction<TaskDescriptor>,
    TaskDescriptor,
    any,
    IPytchAppModel
  >;

  setProgress: Action<
    IModalUserInteraction<TaskDescriptor>,
    InteractionProgress
  >;
  setInputsReady: Action<IModalUserInteraction<TaskDescriptor>, boolean>;
  superLaunch: Thunk<IModalUserInteraction<TaskDescriptor>>;
}

type AttemptActionFunction<Descriptor> = (
  actions: Actions<IPytchAppModel>,
  descriptor: Descriptor
) => Promise<void>;

export function modalUserInteraction<TaskDescriptor, SpecificModel>(
  attemptAction: AttemptActionFunction<TaskDescriptor>,
  specificModel: SpecificModel
): IModalUserInteraction<TaskDescriptor> & SpecificModel {
  const baseModel: IModalUserInteraction<TaskDescriptor> = {
    progress: { status: "not-happening" },
    inputsReady: false,

    isActive: computed((state) => state.progress.status !== "not-happening"),
    isInteractable: computed((state) => {
      const status = state.progress.status;
      return status === "not-tried-yet" || status === "failed";
    }),
    attemptSucceeded: computed(
      (state) => state.progress.status === "succeeded"
    ),
    maybeLastFailureMessage: computed((state) =>
      state.progress.status === "failed" ? state.progress.message : null
    ),

    superLaunch: thunk((actions) => {
      actions.setProgress({ status: "not-tried-yet" });
      actions.setInputsReady(false);
    }),
    dismiss: thunk((actions) =>
      actions.setProgress({ status: "not-happening" })
    ),
    attempt: thunk(async (actions, actionDescriptor, helpers) => {
      try {
        actions.setProgress({ status: "trying" });
        await attemptAction(helpers.getStoreActions(), actionDescriptor);
        actions.setProgress({ status: "succeeded" });
        await delaySeconds(0.8);
        actions.setProgress({ status: "not-happening" });
      } catch (err) {
        actions.setProgress({ status: "failed", message: err.message });
      }
    }),

    setProgress: action((state, newProgress) => {
      state.progress = newProgress;
    }),
    setInputsReady: action((state, inputsReady) => {
      state.inputsReady = inputsReady;
    }),
  };

  return Object.assign({}, baseModel, specificModel);
}
