import { Action, action, Thunk, thunk } from "easy-peasy";
import { PytchAppModelActions } from "..";
import { IRenameAssetDescriptor } from "../project";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { propSetterAction } from "../../utils";

type IRenameAssetBase = IModalUserInteraction<IRenameAssetDescriptor>;

type RenameAssetLaunchArgs = {
  fixedPrefix: string;
  oldNameSuffix: string;
};

interface IRenameAssetSpecific {
  fixedPrefix: string;
  oldStem: string;
  newStem: string;
  fixedSuffix: string;

  setFixedPrefix: Action<IRenameAssetSpecific, string>;
  setOldStem: Action<IRenameAssetSpecific, string>;
  setNewStem: Action<IRenameAssetSpecific, string>;
  setFixedSuffix: Action<IRenameAssetSpecific, string>;
  launch: Thunk<IRenameAssetBase & IRenameAssetSpecific, RenameAssetLaunchArgs>;
}

const attemptRename = (
  actions: PytchAppModelActions,
  renameDescriptor: IRenameAssetDescriptor
) => actions.activeProject.renameAssetAndSync(renameDescriptor);

type FilenameParts = { stem: string; extension: string };
const filenameParts = (name: string): FilenameParts => {
  let fragments = name.split(".");
  if (fragments.length === 1) {
    return { stem: name, extension: "" };
  }

  const bareExtension = fragments.pop();
  if (bareExtension == null) {
    // This really should not happen.
    console.warn(`empty split from "${name}"`);
    return { stem: name, extension: "" };
  }

  const stem = fragments.join(".");
  const extension = `.${bareExtension}`;
  return { stem, extension };
};

const renameAssetSpecific: IRenameAssetSpecific = {
  fixedPrefix: "",
  oldStem: "",
  newStem: "",
  fixedSuffix: "",
  setFixedPrefix: propSetterAction("fixedPrefix"),
  setOldStem: propSetterAction("oldStem"),
  setNewStem: propSetterAction("newStem"),
  setFixedSuffix: propSetterAction("fixedSuffix"),

  launch: thunk((actions, { fixedPrefix, oldNameSuffix }) => {
    actions.setFixedPrefix(fixedPrefix);
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
