import { Action, action, Thunk, thunk } from "easy-peasy";
import { PytchAppModelActions } from "..";
import { IRenameAssetDescriptor } from "../project";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { propSetterAction } from "../../utils";

type IRenameAssetBase = IModalUserInteraction<IRenameAssetDescriptor>;

interface IRenameAssetSpecific {
  oldNameSuffix: string;
  newNameSuffix: string;
  setOldNameSuffix: Action<IRenameAssetSpecific, string>;
  setNewNameSuffix: Action<IRenameAssetSpecific, string>;
  launch: Thunk<IRenameAssetBase & IRenameAssetSpecific, string>;
}

const attemptRename = (
  actions: PytchAppModelActions,
  renameDescriptor: IRenameAssetDescriptor
) => actions.activeProject.renameAssetAndSync(renameDescriptor);

const renameAssetSpecific: IRenameAssetSpecific = {
  oldNameSuffix: "",
  newNameSuffix: "",
  setOldNameSuffix: propSetterAction("oldNameSuffix"),
  setNewNameSuffix: propSetterAction("newNameSuffix"),

  launch: thunk((actions, oldNameSuffix) => {
    actions.setOldNameSuffix(oldNameSuffix);
    actions.setNewNameSuffix(oldNameSuffix);
    actions.superLaunch();
  }),
};

export type IRenameAssetInteraction = IRenameAssetBase & IRenameAssetSpecific;
export const renameAssetInteraction = modalUserInteraction(
  attemptRename,
  renameAssetSpecific
);
