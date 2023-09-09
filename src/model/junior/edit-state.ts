// Model slice for state of how the user is editing a program of
// "per-method" kind.

import { Action, thunk, Thunk } from "easy-peasy";
import { Uuid } from "./structured-program/core-types";
import { StructuredProgram } from "./structured-program/program";
import { IPytchAppModel } from "..";
import { propSetterAction } from "../../utils";
import { addSpriteInteraction, AddSpriteInteraction } from "./add-sprite";
import { IProcessFilesInteraction } from "../user-interactions/process-files";
import { addAssetsInteraction } from "./add-assets";
import {
  IUpsertHatBlockInteraction,
  upsertHatBlockInteraction,
} from "./upsert-hat-block";

export type ActorPropertiesTabKey = "code" | "appearances" | "sounds";
export type InfoPanelTabKey = "output" | "errors";

export type EditState = {
  focusedActor: Uuid;
  setFocusedActor: Action<EditState, Uuid>;

  /** Delete the actor with the given ID, which should be the same as
   * the focused actor's ID.  This redundancy allows consistency
   * checking.  */
  deleteFocusedActor: Thunk<EditState, Uuid, void, IPytchAppModel>;

  // This needs to be in the model (rather than local to the component)
  // because we need to be able to switch to the "code" tab when an
  // error occurs.
  actorPropertiesActiveTab: ActorPropertiesTabKey;
  setActorPropertiesActiveTab: Action<EditState, ActorPropertiesTabKey>;

  // This needs to be in the model (rather than local to the component)
  // because we need to be able to switch to the "errors" tab when an
  // error occurs.
  infoPanelActiveTab: InfoPanelTabKey;
  setInfoPanelActiveTab: Action<EditState, InfoPanelTabKey>;

  bootForProgram: Thunk<EditState, StructuredProgram>;

  addSpriteInteraction: AddSpriteInteraction;
  addAssetsInteraction: IProcessFilesInteraction;
  upsertHatBlockInteraction: IUpsertHatBlockInteraction;
};

export const editState: EditState = {
  focusedActor: "",
  setFocusedActor: propSetterAction("focusedActor"),

  deleteFocusedActor: thunk((actions, actorId, helpers) => {
    const focusedActorId = helpers.getState().focusedActor;
    if (actorId !== focusedActorId) {
      throw new Error(
        `trying to delete actor ${actorId}` +
          ` but actor ${focusedActorId} is focused`
      );
    }

    const newFocusedActorId = helpers
      .getStoreActions()
      .activeProject.deleteSprite(actorId);

    actions.setFocusedActor(newFocusedActorId);
  }),

  actorPropertiesActiveTab: "code",
  setActorPropertiesActiveTab: propSetterAction("actorPropertiesActiveTab"),

  infoPanelActiveTab: "output",
  setInfoPanelActiveTab: propSetterAction("infoPanelActiveTab"),

  bootForProgram: thunk((actions, program) => {
    // Where is the right place to enforce the invariant that the [0]th
    // actor must be of kind "stage"?
    const stage = program.actors[0];
    actions.setFocusedActor(stage.id);
  }),

  addSpriteInteraction,
  addAssetsInteraction,
  upsertHatBlockInteraction,
};
