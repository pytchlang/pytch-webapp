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
import { assertNever, propSetterAction } from "../../utils";
import {
  SpriteUpsertionAction,
  SpriteUpsertionArgs,
} from "./structured-program/program";

type UpsertSpriteLaunchArgs = {
  upsertionAction: SpriteUpsertionAction;
  existingNames: Array<string>;
};

type UpsertSpriteBase = IModalUserInteraction<SpriteUpsertionArgs>;

type UpsertSpriteSpecific = {
  upsertionArgs: SpriteUpsertionArgs;
  setUpsertionArgs: Action<UpsertSpriteSpecific, SpriteUpsertionArgs>;

  _setName: Action<UpsertSpriteSpecific, string>;
  setName: Thunk<UpsertSpriteSpecific, string>;

  existingNames: Array<string>;
  setExistingNames: Action<UpsertSpriteSpecific, Array<string>>;

  nameValidity: NameValidity;
  launch: Thunk<
    UpsertSpriteBase & UpsertSpriteSpecific,
    UpsertSpriteLaunchArgs
  >;
  refreshInputsReady: Action<UpsertSpriteBase & UpsertSpriteSpecific>;
};

const upsertSpriteSpecific: UpsertSpriteSpecific = {
  upsertionArgs: { kind: "insert", name: "" },
  setUpsertionArgs: propSetterAction("upsertionArgs"),

  _setName: action((state, name) => {
    state.upsertionArgs.name = name;
  }),
  setName: thunk((actions, name) => {
    actions._setName(name);
    actions.refreshInputsReady();
  }),

  // The setter is only called from launch() and followed by setName()
  // so can leave nameValidity computation to setName().
  existingNames: [],
  setExistingNames: propSetterAction("existingNames"),

  nameValidity: nameValidity([], ""),

  launch: thunk((actions, { upsertionAction, existingNames }) => {
    // Ugh, sequence of actions here is brittle: superLaunch() sets
    // inputsReady to false; setName() calls refreshInputsReady(), which
    // refers to existingNames to update nameValidity and hence
    // inputsReady.
    actions.superLaunch();

    // This is a bit clunky; we set name to "" here, then overwrite
    // in the switch(){} below.
    actions.setUpsertionArgs({ ...upsertionAction, name: "" });

    switch (upsertionAction.kind) {
      case "insert":
        actions.setExistingNames(existingNames);
        actions.setName(unusedSpriteName(existingNames));
        break;
      case "update": {
        // We don't want the dialog to chide the user about "there's
        // already a sprite with that name" when they haven't changed
        // the default yet, so pretend the current name is not one of
        // the existing names.  We separately catch the case that they
        // haven't changed the default in refreshInputsReady() below.
        const previousName = upsertionAction.previousName;
        const disallowedNames = existingNames.filter((n) => n !== previousName);
        actions.setExistingNames(disallowedNames);
        actions.setName(previousName);
        break;
      }
      default:
        assertNever(upsertionAction);
    }
  }),

  refreshInputsReady: action((state) => {
    state.nameValidity = nameValidity(
      state.existingNames,
      state.upsertionArgs.name
    );

    const args = state.upsertionArgs;

    // If renaming, forbid leaving the name at its previous value:
    const renamingButUnchanged =
      args.kind === "update" && args.name === args.previousName;

    state.inputsReady =
      state.nameValidity.status === "valid" && !renamingButUnchanged;
  }),
};

const attemptUpsertSprite = async (
  actions: PytchAppModelActions,
  descriptor: SpriteUpsertionArgs
) => {
  // This can throw if name already exists, even though we've tried to
  // not let that happen:
  const spriteId = actions.activeProject.upsertSprite(descriptor);

  // The aim here is to focus a newly-added Sprite, but it does no harm
  // to always setFocusedActor(), because for a rename, that Sprite was
  // focused anyway.
  actions.jrEditState.setFocusedActor(spriteId);
};

export type UpsertSpriteInteraction = UpsertSpriteBase & UpsertSpriteSpecific;

export let upsertSpriteInteraction = modalUserInteraction(
  attemptUpsertSprite,
  upsertSpriteSpecific
);
