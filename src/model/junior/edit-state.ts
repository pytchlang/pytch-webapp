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
  | "lesson"
  | "specimen"
  | "tutorial"
  | "demo"
  | "info"
  | "settings"
  | "work"
  | "results";

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

// "Slice Action" and "Slice Thunk".
type SAction<PayloadT = void> = Action<EditState, PayloadT>;
type SThunk<PayloadT, ReturnT = void> = Thunk<
  EditState,
  PayloadT,
  unknown,
  IPytchAppModel,
  ReturnT
>;

export type EditState = {
  mostRecentFocusedEditor: string;
  setMostRecentFocusedEditor: SAction<string>;

  scriptDragInProgress: boolean;
  setScriptDragInProgress: SAction<boolean>;

  activityContentState: ActivityContentState;
  activityContentFullStateLabel: Computed<
    EditState,
    ActivityContentFullStateLabel
  >;
  collapseActivityContent: SAction;
  _expandActivityContent: SAction<ActivityBarTabKey>;
  expandActivityContent: SThunk<ActivityBarTabKey>;

  activeActor: Uuid;
  setActiveActor: SAction<Uuid>;

  /** Delete the actor with the given ID, which should be the same as
   * the active actor's ID.  This redundancy allows consistency
   * checking.  */
  deleteActiveActor: SThunk<Uuid>;

  // This needs to be in the model (rather than local to the component)
  // because we need to be able to switch to the "code" tab when an
  // error occurs.
  actorPropertiesActiveTab: ActorPropertiesTabKey;
  setActorPropertiesActiveTab: SAction<ActorPropertiesTabKey>;

  // This needs to be in the model (rather than local to the component)
  // because we need to be able to switch to the "errors" tab when an
  // error occurs.
  infoPanelActiveTab: InfoPanelTabKey;
  setInfoPanelActiveTab: SAction<InfoPanelTabKey>;

  infoPanelState: InfoPanelState;
  setInfoPanelState: SAction<InfoPanelState>;
  toggleInfoPanelState: SAction;

  expandAndSetActive: SThunk<InfoPanelTabKey>;

  bootForFlatProgram: SThunk<FlatBootData>;
  bootForProgram: SThunk<BootData>;

  assetReorderInProgress: boolean;
  setAssetReorderInProgress: SAction<boolean>;

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
  setActiveActor: action((state, activeActor) => {
    state.activeActor = activeActor;
    state.mostRecentFocusedEditor = "";
  }),

  deleteActiveActor: thunk((actions, actorId, helpers) => {
    const activeActorId = helpers.getState().activeActor;
    if (actorId !== activeActorId) {
      throw new Error(
        `trying to delete actor ${actorId}` +
          ` but actor ${activeActorId} is active`
      );
    }

    const newActiveActorId = helpers
      .getStoreActions()
      .activeProject.deleteSprite(actorId);

    actions.setActiveActor(newActiveActorId);
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

      // TODO: Tidy up duplication of facts between here and IDELayout
      // effect.
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
            actions.expandActivityContent("info");
            break;
          case "jr-tutorial":
            console.log(
              'unexpected "jr-tutorial" linked-content for flat program'
            );
            actions.expandActivityContent("info");
            break;
          case "specimen":
            actions.expandActivityContent("specimen");
            break;
          case "demo":
            actions.expandActivityContent("demo");
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

    // TODO: Tidy up duplication of facts between here and IDELayout
    // effect.
    switch (linkedContentKind) {
      case "none":
        actions.expandActivityContent("info");
        break;
      case "jr-tutorial":
        actions.expandActivityContent("lesson");
        break;
      case "specimen":
        actions.expandActivityContent("specimen");
        break;
      case "demo":
        actions.expandActivityContent("demo");
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
