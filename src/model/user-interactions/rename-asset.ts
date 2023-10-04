import { Action, action, computed, Computed, Thunk, thunk } from "easy-peasy";
import { PytchAppModelActions } from "..";
import { IRenameAssetDescriptor } from "../project";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { propSetterAction } from "../../utils";
import {
  AssetOperationContext,
  AssetOperationContextKey,
  unknownAssetOperationContext,
} from "../asset";

type IRenameAssetBase = IModalUserInteraction<IRenameAssetDescriptor>;

type RenameAssetLaunchArgs = {
  operationContextKey: AssetOperationContextKey;
  fixedPrefix: string;
  oldNameSuffix: string;
};

interface IRenameAssetSpecific {
  operationContext: AssetOperationContext;
  fixedPrefix: string;
  oldStem: string;
  newStem: string;
  fixedSuffix: string;

  setOperationContext: Action<IRenameAssetSpecific, AssetOperationContext>;
  setFixedPrefix: Action<IRenameAssetSpecific, string>;
  setOldStem: Action<IRenameAssetSpecific, string>;
  _setNewStem: Action<IRenameAssetSpecific, string>;
  setNewStem: Thunk<IRenameAssetSpecific, string>;
  setFixedSuffix: Action<IRenameAssetSpecific, string>;

  refreshInputsReady: Action<IRenameAssetBase & IRenameAssetSpecific>;
  launch: Thunk<IRenameAssetBase & IRenameAssetSpecific, RenameAssetLaunchArgs>;
  attemptArgs: Computed<IRenameAssetSpecific, IRenameAssetDescriptor>;
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
  operationContext: unknownAssetOperationContext,
  fixedPrefix: "",
  oldStem: "",
  newStem: "",
  fixedSuffix: "",
  setOperationContext: propSetterAction("operationContext"),
  setFixedPrefix: propSetterAction("fixedPrefix"),
  setOldStem: propSetterAction("oldStem"),

  _setNewStem: propSetterAction("newStem"),
  setNewStem: thunk((actions, newStem) => {
    actions._setNewStem(newStem);
    actions.refreshInputsReady();
  }),

  setFixedSuffix: propSetterAction("fixedSuffix"),

  refreshInputsReady: action((state) => {
    const newStem = state.newStem;
    state.inputsReady = newStem !== "" && newStem !== state.oldStem;
  }),

  launch: thunk((actions, { fixedPrefix, oldNameSuffix }) => {
    const { stem, extension } = filenameParts(oldNameSuffix);
    actions.setFixedPrefix(fixedPrefix);
    actions.setOldStem(stem);
    actions.setNewStem(stem);
    actions.setFixedSuffix(extension);
    actions.superLaunch();
  }),

  attemptArgs: computed((state) => {
    const fixedPrefix = state.fixedPrefix;
    const suffix = state.fixedSuffix;
    const oldNameSuffix = `${state.oldStem}${suffix}`;
    const newNameSuffix = `${state.newStem}${suffix}`;
    return { fixedPrefix, oldNameSuffix, newNameSuffix };
  }),
};

export type IRenameAssetInteraction = IRenameAssetBase & IRenameAssetSpecific;
export const renameAssetInteraction = modalUserInteraction(
  attemptRename,
  renameAssetSpecific
);
