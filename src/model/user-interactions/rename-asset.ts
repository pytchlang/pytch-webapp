import { Action, action, Thunk, thunk } from "easy-peasy";
import { PytchAppModelActions } from "..";
import { IRenameAssetDescriptor } from "../project";
import { IModalUserInteraction, modalUserInteraction } from ".";

type IRenameAssetBase = IModalUserInteraction<IRenameAssetDescriptor>;

interface IRenameAssetSpecific {
  oldName: string;
  newName: string;
  setOldName: Action<IRenameAssetSpecific, string>;
  setNewName: Action<IRenameAssetSpecific, string>;
  launch: Thunk<IRenameAssetBase & IRenameAssetSpecific, string>;
}

const attemptRename = (
  actions: PytchAppModelActions,
  renameDescriptor: IRenameAssetDescriptor
) => actions.activeProject.renameAssetAndSync(renameDescriptor);

const renameAssetSpecific: IRenameAssetSpecific = {
  oldName: "",
  newName: "",
  setOldName: action((state, oldName) => {
    state.oldName = oldName;
  }),
  setNewName: action((state, newName) => {
    state.newName = newName;
  }),
  launch: thunk((actions, oldName) => {
    actions.setOldName(oldName);
    actions.setNewName(oldName);
    actions.superLaunch();
  }),
};

export type IRenameAssetInteraction = IRenameAssetBase & IRenameAssetSpecific;
export const renameAssetInteraction = modalUserInteraction(
  attemptRename,
  renameAssetSpecific
);
