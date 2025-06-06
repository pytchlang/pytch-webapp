// Model slice for state of how the user is editing a program of
// "per-method" kind.

import { action, Action, computed, Computed, thunk, Thunk } from "easy-peasy";
import { Uuid } from "./structured-program/core-types";
import { StructuredProgram } from "./structured-program/program";
import { IPytchAppModel } from "..";
import { assertNever, propSetterAction } from "../../utils";
import { upsertSpriteFlow, UpsertSpriteFlow } from "./upsert-sprite";
import { UpsertHatBlockFlow, upsertHatBlockFlow } from "./upsert-hat-block";
import { LinkedContentKind } from "../linked-content";
import { DeleteSpriteFlow, deleteSpriteFlow } from "./user-flows/delete-sprite";
import {
  DeleteHandlerFlow,
  deleteHandlerFlow,
} from "./user-flows/delete-handler";
import { scrollTopFromPageKey } from "./jr-tutorial";

export type ActorPropertiesTabKey = "code" | "appearances" | "sounds";
export type InfoPanelTabKey = "output" | "errors";

export type InfoPanelState = "collapsed" | "expanded";

export type ActivityBarTabKey =
  | "helpsidebar"
  | "lesson"
  | "specimen"
  | "tutorial";

export type ActivityContentState =
  | { kind: "collapsed" }
  | { kind: "expanded"; tab: ActivityBarTabKey };

// Is there a more DRY way of doing the following?
type ActivityContentFullStateLabel =
  | "collapsed"
  | `expanded-${ActivityBarTabKey}`;

const collapsedActivityContentState: ActivityContentState = {
  kind: "collapsed",
};
const expandedActivityContentState = (
  tab: ActivityBarTabKey
): ActivityContentState => ({
  kind: "expanded",
  tab,
});

type BootData = {
  program: StructuredProgram;
  linkedContentKind: LinkedContentKind;
};

// TODO: This is clunky because we have not yet unified "linked content"
// with "tracked tutorial".
type FlatBootData = {
  linkedContentKind: LinkedContentKind;
  isTrackingTutorial: boolean;
};

export type EditState = {
  mostRecentFocusedEditor: string;
  setMostRecentFocusedEditor: Action<EditState, string>;

  scriptDragInProgress: boolean;
  setScriptDragInProgress: Action<EditState, boolean>;

  activityContentState: ActivityContentState;
  activityContentFullStateLabel: Computed<
    EditState,
    ActivityContentFullStateLabel
  >;
  collapseActivityContent: Action<EditState>;
  _expandActivityContent: Action<EditState, ActivityBarTabKey>;
  expandActivityContent: Thunk<
    EditState,
    ActivityBarTabKey,
    void,
    IPytchAppModel
  >;

  activeActor: Uuid;
  setActiveActor: Action<EditState, Uuid>;

  /** Delete the actor with the given ID, which should be the same as
   * the focused actor's ID.  This redundancy allows consistency
   * checking.  */
  deleteActiveActor: Thunk<EditState, Uuid, void, IPytchAppModel>;

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

  infoPanelState: InfoPanelState;
  setInfoPanelState: Action<EditState, InfoPanelState>;
  toggleInfoPanelState: Action<EditState>;

  expandAndSetActive: Thunk<EditState, InfoPanelTabKey>;

  bootForFlatProgram: Thunk<EditState, FlatBootData>;
  bootForProgram: Thunk<EditState, BootData>;

  assetReorderInProgress: boolean;
  setAssetReorderInProgress: Action<EditState, boolean>;

  upsertSpriteFlow: UpsertSpriteFlow;
  upsertHatBlockFlow: UpsertHatBlockFlow;
  deleteSpriteFlow: DeleteSpriteFlow;
  deleteHandlerFlow: DeleteHandlerFlow;
};

export const editState: EditState = {
  mostRecentFocusedEditor: "",
  setMostRecentFocusedEditor: propSetterAction("mostRecentFocusedEditor"),

  scriptDragInProgress: false,
  setScriptDragInProgress: propSetterAction("scriptDragInProgress"),

  activityContentState: collapsedActivityContentState,
  activityContentFullStateLabel: computed((state) => {
    const activityState = state.activityContentState;
    switch (activityState.kind) {
      case "collapsed":
        return "collapsed" as const;
      case "expanded":
        return `expanded-${activityState.tab}` as const;
      default:
        return assertNever(activityState);
    }
  }),
  collapseActivityContent: action((state) => {
    state.activityContentState = collapsedActivityContentState;
  }),
  _expandActivityContent: action((state, tab) => {
    state.activityContentState = expandedActivityContentState(tab);
  }),
  expandActivityContent: thunk((actions, tab) => {
    actions._expandActivityContent(tab);
  }),

  activeActor: "",
  setActiveActor: action((state, focusedActor) => {
    state.activeActor = focusedActor;
    state.mostRecentFocusedEditor = "";
  }),

  deleteActiveActor: thunk((actions, actorId, helpers) => {
    const focusedActorId = helpers.getState().activeActor;
    if (actorId !== focusedActorId) {
      throw new Error(
        `trying to delete actor ${actorId}` +
          ` but actor ${focusedActorId} is focused`
      );
    }

    const newFocusedActorId = helpers
      .getStoreActions()
      .activeProject.deleteSprite(actorId);

    actions.setActiveActor(newFocusedActorId);
  }),

  actorPropertiesActiveTab: "code",
  setActorPropertiesActiveTab: propSetterAction("actorPropertiesActiveTab"),

  infoPanelActiveTab: "output",
  setInfoPanelActiveTab: propSetterAction("infoPanelActiveTab"),

  infoPanelState: "expanded",
  setInfoPanelState: propSetterAction("infoPanelState"),
  toggleInfoPanelState: action((state) => {
    state.infoPanelState =
      state.infoPanelState === "collapsed" ? "expanded" : "collapsed";
  }),

  expandAndSetActive: thunk((actions, tabKey) => {
    actions.setInfoPanelState("expanded");
    actions.setInfoPanelActiveTab(tabKey);
  }),

  bootForFlatProgram: thunk(
    (actions, { linkedContentKind, isTrackingTutorial }) => {
      actions.setInfoPanelActiveTab("output");
      actions.setInfoPanelState("expanded");
      scrollTopFromPageKey.clear();

      const hasLinkedContent = linkedContentKind !== "none";
      if (isTrackingTutorial) {
        if (hasLinkedContent) {
          // Warn but proceed anyway with tracking tutorial.
          console.log(
            `unexpected linked content "${linkedContentKind}"` +
              " for isTrackingTutorial"
          );
        }
        actions.expandActivityContent("tutorial");
      } else {
        switch (linkedContentKind) {
          case "none":
            actions.expandActivityContent("helpsidebar");
            break;
          case "jr-tutorial":
            console.log(
              'unexpected "jr-tutorial" linked-content for flat program'
            );
            actions.expandActivityContent("helpsidebar");
            break;
          case "specimen":
            actions.expandActivityContent("specimen");
            break;
          default:
            assertNever(linkedContentKind);
        }
      }
    }
  ),

  bootForProgram: thunk((actions, { program, linkedContentKind }) => {
    // Where is the right place to enforce the invariant that the [0]th
    // actor must be of kind "stage"?
    const stage = program.actors[0];
    actions.setActiveActor(stage.id);

    actions.setActorPropertiesActiveTab("code");
    actions.setInfoPanelActiveTab("output");
    actions.setInfoPanelState("expanded");
    actions.setMostRecentFocusedEditor("");
    scrollTopFromPageKey.clear();

    switch (linkedContentKind) {
      case "none":
        actions.expandActivityContent("helpsidebar");
        break;
      case "jr-tutorial":
        actions.expandActivityContent("lesson");
        break;
      case "specimen":
        actions.expandActivityContent("specimen");
        break;
      default:
        assertNever(linkedContentKind);
    }
  }),

  assetReorderInProgress: false,
  setAssetReorderInProgress: propSetterAction("assetReorderInProgress"),

  upsertSpriteFlow,
  upsertHatBlockFlow,
  deleteSpriteFlow,
  deleteHandlerFlow,
};
