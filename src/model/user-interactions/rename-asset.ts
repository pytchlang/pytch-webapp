import { Action, action, Computed, computed, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { delaySeconds } from "../../utils";
import { IAssetRenameDescriptor } from "../ui";
import { InteractionProgress } from ".";
import { batch } from "react-redux";

export interface IRenameAssetInteraction {
  oldName: string;
  newName: string;
  setOldName: Action<IRenameAssetInteraction, string>;
  setNewName: Action<IRenameAssetInteraction, string>;

  progress: InteractionProgress;
  inputsReady: boolean;

  isActive: Computed<IRenameAssetInteraction, boolean>;
  isInteractable: Computed<IRenameAssetInteraction, boolean>;
  attemptSucceeded: Computed<IRenameAssetInteraction, boolean>;
  maybeLastFailureMessage: Computed<IRenameAssetInteraction, string | null>;

  launch: Thunk<IRenameAssetInteraction, string>;
  dismiss: Thunk<IRenameAssetInteraction>;
  attempt: Thunk<
    IRenameAssetInteraction,
    IAssetRenameDescriptor,
    any,
    IPytchAppModel
  >;

  setProgress: Action<IRenameAssetInteraction, InteractionProgress>;
  setInputsReady: Action<IRenameAssetInteraction, boolean>;
}

export const renameAssetInteraction: IRenameAssetInteraction = {
  oldName: "",
  newName: "",
  setOldName: action((state, oldName) => {
    state.oldName = oldName;
  }),
  setNewName: action((state, newName) => {
    state.newName = newName;
  }),
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

  launch: thunk((actions, oldName) => {
    batch(() => {
      actions.setOldName(oldName);
      actions.setNewName(oldName);
      actions.setProgress({ status: "not-tried-yet" });
      actions.setInputsReady(false);
    });
  }),
  dismiss: thunk((actions) => actions.setProgress({ status: "not-happening" })),
  attempt: thunk(async (actions, renameDescriptor, helpers) => {
    try {
      actions.setProgress({ status: "trying" });
      await helpers
        .getStoreActions()
        .activeProject.renameAssetAndSync(renameDescriptor);
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
