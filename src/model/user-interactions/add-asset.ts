import { Action, action, Computed, computed, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { delaySeconds } from "../../utils";
import { IRequestAddAssetPayload } from "../project";

export type IAddAssetInteractionProgress =
  | { status: "not-happening" }
  | { status: "not-tried-yet" }
  | { status: "trying" }
  | { status: "succeeded" }
  | { status: "failed"; message: string };

export interface IAddAssetInteraction {
  progress: IAddAssetInteractionProgress;
  inputsReady: boolean;

  isActive: Computed<IAddAssetInteraction, boolean>;
  isInteractable: Computed<IAddAssetInteraction, boolean>;
  attemptSucceeded: Computed<IAddAssetInteraction, boolean>;
  maybeLastFailureMessage: Computed<IAddAssetInteraction, string | null>;

  launch: Thunk<IAddAssetInteraction>;
  dismiss: Thunk<IAddAssetInteraction>;
  attempt: Thunk<
    IAddAssetInteraction,
    IRequestAddAssetPayload,
    any,
    IPytchAppModel
  >;

  setProgress: Action<IAddAssetInteraction, IAddAssetInteractionProgress>;
  setInputsReady: Action<IAddAssetInteraction, boolean>;
}

export const addAssetInteraction: IAddAssetInteraction = {
  progress: { status: "not-happening" },
  inputsReady: false,

  isActive: computed((state) => state.progress.status !== "not-happening"),
  isInteractable: computed((state) => {
    const status = state.progress.status;
    return status === "not-tried-yet" || status === "failed";
  }),
  attemptSucceeded: computed((state) => state.progress.status === "succeeded"),
  maybeLastFailureMessage: computed((state) =>
    state.progress.status === "failed" ? state.progress.message : null
  ),

  launch: thunk((actions) => {
    actions.setProgress({ status: "not-tried-yet" });
    actions.setInputsReady(false);
  }),
  dismiss: thunk((actions) => actions.setProgress({ status: "not-happening" })),
  attempt: thunk(async (actions, addDescriptor, helpers) => {
    try {
      actions.setProgress({ status: "trying" });
      await helpers
        .getStoreActions()
        .activeProject.requestAddAssetAndSync(addDescriptor);
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
