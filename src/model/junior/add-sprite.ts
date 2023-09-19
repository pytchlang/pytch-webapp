import { action, Action, thunk, Thunk } from "easy-peasy";
import { PytchAppModelActions } from "..";

import {
  IModalUserInteraction,
  modalUserInteraction,
} from "../user-interactions";
import {
  NameValidity,
  nameValidity,
  unusedSpriteName,
} from "./structured-program/name-validity";
import { propSetterAction } from "../../utils";
import {
  SpriteUpsertionAction,
  SpriteUpsertionArgs,
} from "./structured-program/program";

type AddSpriteLaunchArgs = {
  upsertionAction: SpriteUpsertionAction;
  existingNames: Array<string>;
};

type AddSpriteBase = IModalUserInteraction<AddSpriteDescriptor>;

type AddSpriteSpecific = {
  upsertionArgs: SpriteUpsertionArgs;
  setUpsertionArgs: Action<AddSpriteSpecific, SpriteUpsertionArgs>;
  nameValidity: NameValidity;
  _setName: Action<AddSpriteSpecific, string>;
  setName: Thunk<AddSpriteSpecific, string>;
  setExistingNames: Action<AddSpriteSpecific, Array<string>>;
  launch: Thunk<AddSpriteBase & AddSpriteSpecific, AddSpriteLaunchArgs>;
  refreshInputsReady: Action<AddSpriteBase & AddSpriteSpecific>;
};

const addSpriteSpecific: AddSpriteSpecific = {
  upsertionArgs: { kind: "insert", name: "" },
  setUpsertionArgs: propSetterAction("upsertionArgs"),

  _setName: propSetterAction("name"),
  setName: thunk((actions, name) => {
    actions._setName(name);
    actions.refreshInputsReady();
  }),

  // The setter is only called from launch() and followed by setName()
  // so can leave nameValidity computation to setName().
  existingNames: [],
  setExistingNames: propSetterAction("existingNames"),

  nameValidity: nameValidity([], ""),

  launch: thunk((actions, { existingNames }) => {
    // Ugh, sequence of actions here is brittle: superLaunch() sets
    // inputsReady to false; refreshInputsReady() refers to
    // existingNames to update nameValidity and hence inputsReady.
    actions.superLaunch();
    actions.setExistingNames(existingNames);
    actions.setName(unusedSpriteName(existingNames));
  }),

  refreshInputsReady: action((state) => {
    state.nameValidity = nameValidity(state.existingNames, state.name);
    state.inputsReady = state.nameValidity.status === "valid";
  }),
};

const attemptAddSprite = async (
  actions: PytchAppModelActions,
  descriptor: AddSpriteDescriptor
) => {
  // This can throw if name already exists, even though we've tried to
  // not let that happen:
  actions.activeProject.addSprite(descriptor.name);
};

export type AddSpriteInteraction = AddSpriteBase & AddSpriteSpecific;

export let addSpriteInteraction = modalUserInteraction(
  attemptAddSprite,
  addSpriteSpecific
);
