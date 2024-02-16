import { IAssetInProject, AssetPresentation } from "./asset";

import { ProjectId, ITrackedTutorial, StoredProjectData } from "./project-core";
import {
  LinkedContentRef,
  LinkedContentRefNone,
  LinkedContent,
  eqLinkedContentRefs,
  lessonDescriptorFromRelativePath,
  LinkedContentKind,
  LinkedContentOfKind,
  LinkedContentRefUpdate,
} from "./linked-content";
import {
  Action,
  action,
  Thunk,
  thunk,
  Computed,
  computed,
  Actions,
} from "easy-peasy";
import {
  projectDescriptor,
  addAssetToProject,
  updateProject,
  assetsInProject,
  deleteAssetFromProject,
  renameAssetInProject,
  projectSummary,
  updateAssetTransform,
  reorderAssetsInProject,
  updateLinkedContentRef,
  enqueueSyncTask,
} from "../database/indexed-db";

import { AssetTransform } from "./asset";
import {
  build,
  BuildOutcomeKind,
  BuildOutcome,
  BuildOutcomeKindOps,
} from "../skulpt-connection/build";
import { IPytchAppModel } from ".";
import { assetServer } from "../skulpt-connection/asset-server";
import {
  assertNever,
  failIfNull,
  parsedHtmlBody,
  propSetterAction,
  valueCell,
} from "../utils";
import { codeJustBeforeWipChapter, tutorialContentFromHTML } from "./tutorial";
import { liveReloadURL } from "./live-reload";

import { fireAndForgetEvent } from "./anonymous-instrumentation";

import { getFlatAceController } from "../skulpt-connection/code-editor";
import { PytchProgramKind, PytchProgramOps } from "./pytch-program";
import { Uuid } from "./junior/structured-program/core-types";
import {
  HandlerDeletionDescriptor,
  HandlerUpsertionDescriptor,
  PythonCodeUpdateDescriptor,
  HandlersReorderingDescriptor,
  SpriteUpsertionArgs,
  StructuredProgram,
  StructuredProgramOps,
} from "./junior/structured-program/program";
import { AssetOperationContext } from "./asset";
import { AssetMetaDataOps } from "./junior/structured-program";
import {
  JrTutorialContent,
  jrTutorialContentFromHTML,
  jrTutorialContentFromName,
} from "./junior/jr-tutorial";

const ensureKind = PytchProgramOps.ensureKind;

type FocusDestination = "editor" | "running-project";

/** A project which is stored in the browser's indexed-DB and whose
 * assets are described by their ID (rather than their data). */
export type StoredProjectDescriptor = StoredProjectData<IAssetInProject>;

/** A project which is stored in the browser's indexed-DB and whose
 * assets are stored in a form ready for use in the DOM.  E.g., images
 * are stored as `HTMLImageElement` instances.  (In fact sounds are not
 * stored like this because have not yet worked out how to get a
 * suitable `AudioContext`.) */
export type StoredProjectContent = StoredProjectData<AssetPresentation>;

// TODO: Add error message or similar to "failed".
type SyncRequestOutcome = "succeeded" | "failed";
type SyncRequestState = "pending" | SyncRequestOutcome;

interface ILoadSaveRequest {
  projectId: ProjectId;
  seqnum: number;
  state: SyncRequestState;
}

export interface ILoadSaveStatus {
  loadState: SyncRequestState;
  saveState: SyncRequestState;
}

export const equalILoadSaveStatus = (x: ILoadSaveStatus, y: ILoadSaveStatus) =>
  x.loadState === y.loadState && x.saveState === y.saveState;

// Used elsewhere but maybe those places needed review too?
export enum SyncState {
  SyncNotStarted,
  SyncingFromBackEnd,
  SyncingToBackEnd,
  Syncd,
  Error,
}

interface ISetCodeTextAndBuildPayload {
  codeText: string;
  focusDestination: FocusDestination;
}

export interface IAddAssetDescriptor {
  name: string;
  mimeType: string;
  data: ArrayBuffer;
}

export interface IDeleteAssetDescriptor {
  name: string;
}

export interface IRenameAssetDescriptor {
  operationContext: AssetOperationContext;
  fixedPrefix: string;
  oldNameSuffix: string;
  newNameSuffix: string;
}

export interface IRenameProjectDescriptor {
  projectId: ProjectId;
  newName: string;
}

export type AssetLocator = {
  projectId: ProjectId;
  assetName: string;
};

export type UpdateAssetTransformDescriptor = AssetLocator & {
  newTransform: AssetTransform;
};

export type AssetsReorderingDescriptor = {
  projectId: ProjectId;
  movingAssetName: string;
  targetAssetName: string;
};

interface ILiveReloadInfoMessage {
  kind: "info";
  message: string;
}

interface ILiveReloadCodeMessage {
  kind: "code";
  text: string;
}

interface ILiveReloadTutorialMessage {
  kind: "tutorial";
  tutorial_name: string;
  text: string;
}

type ILiveReloadMessage =
  | ILiveReloadInfoMessage
  | ILiveReloadCodeMessage
  | ILiveReloadTutorialMessage;

type CodeStateVsStorage =
  | "unsaved-changes-exist"
  | "no-changes-since-last-save";

export type LinkedContentLoadingState =
  | { kind: "idle" }
  | { kind: "pending"; projectId: ProjectId; contentRef: LinkedContentRef }
  | { kind: "succeeded"; projectId: ProjectId; content: LinkedContent }
  | { kind: "failed" };

type SucceededStateOfKind<KindT extends LinkedContentKind> =
  LinkedContentLoadingState & {
    kind: "succeeded";
    content: LinkedContentOfKind<KindT>;
  };

type SpriteUpsertionAugArgs = {
  args: SpriteUpsertionArgs;
  handleSpriteId(uuid: Uuid): void;
};

type SpriteDeletionAugArgs = {
  spriteId: Uuid;
  handleSpriteId(uuid: Uuid): void;
};

function assertLinkedContentSucceededOfKind<KindT extends LinkedContentKind>(
  loadingState: LinkedContentLoadingState,
  requiredContentKind: KindT
): asserts loadingState is SucceededStateOfKind<KindT> {
  if (loadingState.kind !== "succeeded") {
    throw new Error("have not succeeded in loading linked content");
  }

  const contentKind = loadingState.content.kind;
  if (contentKind !== requiredContentKind) {
    throw new Error(
      `required linked-content-kind "${requiredContentKind}"` +
        ` but have kind "${contentKind}"`
    );
  }
}

type LinkedContentLoadTaskDescriptor = {
  projectId: ProjectId;
  linkedContentRef: LinkedContentRef;
};

export interface IActiveProject {
  latestLoadRequest: ILoadSaveRequest;
  latestSaveRequest: ILoadSaveRequest;

  noteLoadRequest: Action<IActiveProject, ILoadSaveRequest>;
  noteLoadRequestOutcome: Action<IActiveProject, SyncRequestOutcome>;
  noteSaveRequest: Action<IActiveProject, ILoadSaveRequest>;
  noteSaveRequestOutcome: Action<IActiveProject, SyncRequestOutcome>;

  syncState: Computed<IActiveProject, ILoadSaveStatus>;
  project: StoredProjectContent;

  linkedContentLoadingState: LinkedContentLoadingState;
  setLinkedContentLoadingState: Action<
    IActiveProject,
    LinkedContentLoadingState
  >;
  updateLinkedContentRef: Thunk<IActiveProject, LinkedContentRefUpdate>;

  editSeqNum: number;
  lastSyncFromStorageSeqNum: number;
  codeStateVsStorage: CodeStateVsStorage;
  buildSeqnum: number;
  tutorialNavigationSeqnum: number;

  haveProject: Computed<IActiveProject, boolean>;

  initialiseContent: Action<IActiveProject, StoredProjectContent>;
  setAssets: Action<IActiveProject, Array<AssetPresentation>>;

  syncDummyProject: Action<IActiveProject>;
  ensureSyncFromStorage: Thunk<IActiveProject, ProjectId, void, IPytchAppModel>;
  doLinkedContentLoadTask: Thunk<
    IActiveProject,
    LinkedContentLoadTaskDescriptor
  >;
  syncAssetsFromStorage: Thunk<IActiveProject, void, void, IPytchAppModel>;
  deactivate: Thunk<IActiveProject>;

  addAssetAndSync: Thunk<
    IActiveProject,
    IAddAssetDescriptor,
    void,
    IPytchAppModel
  >;
  deleteAssetAndSync: Thunk<
    IActiveProject,
    IDeleteAssetDescriptor,
    void,
    IPytchAppModel,
    Promise<void>
  >;
  renameAssetAndSync: Thunk<
    IActiveProject,
    IRenameAssetDescriptor,
    void,
    IPytchAppModel
  >;
  updateAssetTransformAndSync: Thunk<
    IActiveProject,
    UpdateAssetTransformDescriptor,
    void,
    IPytchAppModel
  >;

  ////////////////////////////////////////////////////////////////////////
  // Only relevant when working with a "per-method" program:

  // Internal helpers; see implementation for comments.
  _upsertSprite: Action<IActiveProject, SpriteUpsertionAugArgs>;
  _deleteSprite: Action<IActiveProject, SpriteDeletionAugArgs>;

  // Return the Uuid of the inserted/updated Sprite.
  upsertSprite: Thunk<
    IActiveProject,
    SpriteUpsertionArgs,
    void,
    IPytchAppModel,
    Uuid
  >;

  deleteSprite: Thunk<IActiveProject, Uuid, void, IPytchAppModel, Uuid>;

  // The "public" thunk performs the matching action and then notes that
  // a code change has occurred via the noteCodeChange() action.
  _upsertHandler: Action<IActiveProject, HandlerUpsertionDescriptor>;
  upsertHandler: Thunk<IActiveProject, HandlerUpsertionDescriptor>;
  _setHandlerPythonCode: Action<IActiveProject, PythonCodeUpdateDescriptor>;
  setHandlerPythonCode: Thunk<IActiveProject, PythonCodeUpdateDescriptor>;
  _deleteHandler: Action<IActiveProject, HandlerDeletionDescriptor>;
  deleteHandler: Thunk<IActiveProject, HandlerDeletionDescriptor>;
  _reorderHandlers: Action<IActiveProject, HandlersReorderingDescriptor>;
  reorderHandlers: Thunk<IActiveProject, HandlersReorderingDescriptor>;

  reorderAssetsAndSync: Thunk<
    IActiveProject,
    AssetsReorderingDescriptor,
    void,
    IPytchAppModel
  >;

  setLinkedLessonContent: Action<IActiveProject, JrTutorialContent>;
  _setLinkedLessonChapterIndex: Action<IActiveProject, number>;
  setLinkedLessonChapterIndex: Thunk<IActiveProject, number>;

  ////////////////////////////////////////////////////////////////////////

  _setCodeText: Action<IActiveProject, string>;
  setCodeText: Thunk<IActiveProject, string>;
  setCodeTextAndBuild: Thunk<IActiveProject, ISetCodeTextAndBuildPayload>;
  requestSyncToStorage: Thunk<IActiveProject, void, void, IPytchAppModel>;
  noteCodeChange: Action<IActiveProject>;
  noteCodeSaved: Action<IActiveProject>;

  /** Replace the content and current chapter of the tutorial, syncing
   * the code to the code as of the end of the previous chapter.  Only
   * meant to be used as part of the support mechanism for tutorial
   * development with the live-reload watcher.
   */
  replaceTutorialAndSyncCode: Action<IActiveProject, ITrackedTutorial>;

  handleLiveReloadMessage: Thunk<IActiveProject, string, void, IPytchAppModel>;
  handleLiveReloadError: Thunk<IActiveProject, void, void, IPytchAppModel>;

  setActiveTutorialChapter: Action<IActiveProject, number>;

  incrementBuildSeqnum: Action<IActiveProject>;
  build: Thunk<IActiveProject, FocusDestination, void, IPytchAppModel>;

  ////////////////////////////////////////////////////////////////////////
  // Background sync

  nPendingSyncActions: number;
  pendingSyncActionsExist: Computed<IActiveProject, boolean>;
  increaseNPendingSyncActions: Action<IActiveProject, number>;
}

const dummyPytchProgram = PytchProgramOps.fromPythonCode(
  "#\n# Your project is loading....\n#\n"
);

const dummyProject: StoredProjectContent = {
  id: -1,
  name: "...Loading project...",
  program: dummyPytchProgram,
  assets: [],
  linkedContentRef: LinkedContentRefNone,
};

const failIfDummy = (project: StoredProjectContent, label: string) => {
  if (project.id === -1) {
    throw new Error(`${label}: cannot work with dummy project`);
  }
};

const ensureStructured = (
  project: StoredProjectContent,
  label: string
): StructuredProgram => {
  failIfDummy(project, label);
  return ensureKind(`${label}()`, project.program, "per-method").program;
};

/** Create a thunk which performs a specified action and then calls
 * `noteCodeChanged()`.  The action is specified using the same
 * `actionMapper` approach as is used in thunks.  See `deleteHandler()`
 * for an example. */
function notingCodeChange<ArgT, MapResultT extends (arg: ArgT) => void>(
  mapActions: (actions: Actions<IActiveProject>) => MapResultT
): Thunk<IActiveProject, ArgT> {
  return thunk((actions, arg) => {
    mapActions(actions)(arg);
    actions.noteCodeChange();
  });
}

export const activeProject: IActiveProject = {
  // Auto-increment ID is always positive, so "-1" will never compare
  // equal to a real project-id.
  latestLoadRequest: { projectId: -1, seqnum: 1000, state: "failed" },
  latestSaveRequest: { projectId: -1, seqnum: 1000, state: "failed" },

  noteLoadRequest: action((state, request) => {
    state.latestLoadRequest = request;
  }),
  noteLoadRequestOutcome: action((state, outcome) => {
    state.latestLoadRequest.state = outcome;
  }),
  noteSaveRequest: action((state, request) => {
    state.latestSaveRequest = request;
  }),
  noteSaveRequestOutcome: action((state, outcome) => {
    state.latestSaveRequest.state = outcome;
  }),

  syncState: computed((state) => ({
    loadState: state.latestLoadRequest.state,
    saveState: state.latestSaveRequest.state,
  })),

  project: dummyProject,

  linkedContentLoadingState: { kind: "idle" },
  setLinkedContentLoadingState: propSetterAction("linkedContentLoadingState"),

  updateLinkedContentRef: thunk((_actions, update) => {
    updateLinkedContentRef(update);
  }),

  editSeqNum: 1,
  lastSyncFromStorageSeqNum: 0,

  codeStateVsStorage: "no-changes-since-last-save",
  buildSeqnum: 0,
  tutorialNavigationSeqnum: 0,

  noteCodeChange: action((state) => {
    state.codeStateVsStorage = "unsaved-changes-exist";
  }),
  noteCodeSaved: action((state) => {
    state.codeStateVsStorage = "no-changes-since-last-save";
  }),

  haveProject: computed((state) => state.project.id !== -1),

  initialiseContent: action((state, content) => {
    state.project = content;
    state.editSeqNum += 1;
    state.lastSyncFromStorageSeqNum = state.editSeqNum;
    console.log("have set project content for id", content.id);
  }),

  setAssets: action((state, assetPresentations) => {
    let project = state.project;
    failIfDummy(project, "setAssets");
    project.assets = assetPresentations;
  }),

  ////////////////////////////////////////////////////////////////////////

  // The clunky dance for upsertSprite() and deleteSprite() is because
  // modifications to app state have to be made within an Action, but we
  // need information learnt from the process of changing state, to
  // return to the caller of a thunk.  We manage this by having the
  // Action accept a callback arg, which can be used within the
  // corresponding Thunk wrapping the Action.  There might a better way.

  _upsertSprite: action((state, augArgs) => {
    let program = ensureStructured(state.project, "_upsertSprite");
    const affectedSpriteId = StructuredProgramOps.upsertSprite(
      program,
      augArgs.args
    );
    augArgs.handleSpriteId(affectedSpriteId);
  }),
  upsertSprite: thunk((actions, args) => {
    let idCell = valueCell<Uuid>("");
    actions._upsertSprite({ args, handleSpriteId: idCell.set });
    actions.noteCodeChange();
    return idCell.get();
  }),

  _deleteSprite: action((state, augArgs) => {
    let program = ensureStructured(state.project, "deleteSprite");
    const adjacentSpriteId = StructuredProgramOps.deleteSprite(
      program,
      augArgs.spriteId
    );
    augArgs.handleSpriteId(adjacentSpriteId);
  }),
  deleteSprite: thunk((actions, spriteId) => {
    let idCell = valueCell<Uuid>("");
    actions._deleteSprite({ spriteId, handleSpriteId: idCell.set });
    actions.noteCodeChange();
    return idCell.get();
  }),

  _upsertHandler: action((state, upsertionDescriptor) => {
    let program = ensureStructured(state.project, "upsertHandler");
    StructuredProgramOps.upsertHandler(program, upsertionDescriptor);
  }),
  upsertHandler: notingCodeChange((a) => a._upsertHandler),

  _setHandlerPythonCode: action((state, updateDescriptor) => {
    let program = ensureStructured(state.project, "setHandlerPythonCode");
    StructuredProgramOps.updatePythonCode(program, updateDescriptor);
  }),
  setHandlerPythonCode: notingCodeChange((a) => a._setHandlerPythonCode),

  _deleteHandler: action((state, deletionDescriptor) => {
    let program = ensureStructured(state.project, "deleteHandler");
    StructuredProgramOps.deleteHandler(program, deletionDescriptor);
    // TODO: Examine return value for failure.
  }),
  deleteHandler: notingCodeChange((a) => a._deleteHandler),

  _reorderHandlers: action((state, reorderDescriptor) => {
    let program = ensureStructured(state.project, "reorderHandlers");
    StructuredProgramOps.reorderHandlersOfActor(program, reorderDescriptor);
  }),
  reorderHandlers: notingCodeChange((a) => a._reorderHandlers),

  reorderAssetsAndSync: thunk(async (actions, descriptor, helpers) => {
    const { movingAssetName, targetAssetName } = descriptor;
    const setInProgress =
      helpers.getStoreActions().jrEditState.setAssetReorderInProgress;

    const owningActorId = AssetMetaDataOps.commonActorIdComponent(
      movingAssetName,
      targetAssetName
    );

    try {
      setInProgress(true);
      await reorderAssetsInProject(
        descriptor.projectId,
        movingAssetName,
        targetAssetName,
        AssetMetaDataOps.nameBelongsToActor(owningActorId)
      );
      await actions.syncAssetsFromStorage();
    } catch (err) {
      console.log("reorderAssetsAndSync(): error", err);
    } finally {
      setInProgress(false);
    }
  }),

  setLinkedLessonContent: action((state, content) => {
    const contentState = state.linkedContentLoadingState;
    assertLinkedContentSucceededOfKind(contentState, "jr-tutorial");
    contentState.content.content = content;
  }),

  _setLinkedLessonChapterIndex: action((state, chapterIndex) => {
    const contentState = state.linkedContentLoadingState;
    assertLinkedContentSucceededOfKind(contentState, "jr-tutorial");
    contentState.content.interactionState.chapterIndex = chapterIndex;
  }),
  setLinkedLessonChapterIndex: thunk((actions, chapterIndex, helpers) => {
    actions._setLinkedLessonChapterIndex(chapterIndex);
    const contentState = helpers.getState().linkedContentLoadingState;
    assertLinkedContentSucceededOfKind(contentState, "jr-tutorial");
    const update: LinkedContentRefUpdate = {
      projectId: contentState.projectId,
      contentRef: {
        kind: "jr-tutorial",
        name: contentState.content.content.name,
        interactionState: contentState.content.interactionState,
      },
    };

    actions.increaseNPendingSyncActions(1);
    enqueueSyncTask({
      key: `linked-${contentState.projectId}`,
      action: () => updateLinkedContentRef(update),
      onRetired: () => actions.increaseNPendingSyncActions(-1),
    });
  }),

  ////////////////////////////////////////////////////////////////////////

  _setCodeText: action((state, text) => {
    let project = state.project;
    failIfDummy(project, "setCodeText");

    let program = ensureKind("setCodeText()", project.program, "flat");
    program.text = text;
    state.editSeqNum += 1;
  }),
  setCodeText: notingCodeChange((a) => a._setCodeText),

  setCodeTextAndBuild: thunk(async (actions, payload) => {
    actions.setCodeText(payload.codeText);
    await actions.build(payload.focusDestination);
  }),

  syncDummyProject: action((state) => {
    const newSeqnum = state.latestLoadRequest.seqnum + 1;

    state.latestLoadRequest = {
      projectId: -1,
      seqnum: newSeqnum,
      state: "failed",
    };

    state.project = dummyProject;
  }),

  // Because the DB operations are all asynchronous, we must cope with the
  // situation where the user:
  //
  // navigates to a particular project
  // navigates back to their project list
  // navigates to a second project
  //
  // in quick succession, such that the first project's data hasn't
  // arrived by the time the second project's load request is
  // launched.  When the first project's data does arrive, we want to
  // throw it away.  We do this by maintaining state describing the
  // 'latest load request'.  It contains a sequence number,
  // incremented whenever we start work on a new load request.  When
  // the data relating to a load request with a particular sequence
  // number becomes available, we only act on it (i.e., set the active
  // project's contents) if our sequence number matches that of the
  // now-current live load request.  Otherwise, we conclude that a
  // later load request was started, and throw away the data we've
  // found.  A dummy project, with a "succeeded" load-request status
  // which can be set synchronously, allows us to work consistently
  // with deactivating a project.
  //
  ensureSyncFromStorage: thunk(async (actions, projectId, helpers) => {
    console.log("ensureSyncFromStorage(): starting for", projectId);

    const previousLoadRequest = helpers.getState().latestLoadRequest;

    if (previousLoadRequest.projectId === projectId) {
      console.log("ensureSyncFromStorage(): already requested; leaving");
      return;
    }

    const ourSeqnum = previousLoadRequest.seqnum + 1;
    console.log("ensureSyncFromStorage(): starting; seqnum", ourSeqnum);

    actions.noteLoadRequest({ projectId, seqnum: ourSeqnum, state: "pending" });

    const storeActions = helpers.getStoreActions();

    storeActions.standardOutputPane.clear();
    storeActions.errorReportList.clear();
    actions.noteCodeSaved();

    try {
      const summary = await projectSummary(projectId);

      // Just set this off; do not await it.  If the network is slow or
      // broken we don't want to hold up the rest of the student's work.
      actions.doLinkedContentLoadTask({
        projectId,
        linkedContentRef: summary.linkedContentRef,
      });

      const descriptor = await projectDescriptor(projectId);
      const initialTabKey =
        descriptor.trackedTutorial != null ? "tutorial" : "assets";

      // TODO: Should the asset-server be local to the project?  Might
      // save all the to/fro with prepare/clear and knowing when to revoke
      // the image-urls?

      const assetPresentations = await Promise.all(
        descriptor.assets.map((a) => AssetPresentation.create(a))
      );

      const content: StoredProjectContent = {
        id: descriptor.id,
        name: summary.name,
        assets: assetPresentations,
        program: descriptor.program,
        linkedContentRef: descriptor.linkedContentRef,
        trackedTutorial: descriptor.trackedTutorial,
      };

      // We now have everything we need.  Is the caller still interested
      // in it?  The live load request might have been re-assigned, so
      // re-extract it:
      const liveLoadRequest = helpers.getState().latestLoadRequest;
      if (liveLoadRequest.seqnum !== ourSeqnum) {
        console.log(
          "ensureSyncFromStorage():" +
            ` live seqnum is ${liveLoadRequest.seqnum}` +
            ` but we are working on ${ourSeqnum}; abandoning`
        );
        return;
      }

      actions.initialiseContent(content);
      if (content.trackedTutorial != null) {
        actions.setActiveTutorialChapter(
          content.trackedTutorial.activeChapterIndex
        );
      }

      storeActions.ideLayout.helpSidebar.hideAllContent();

      if (content.program.kind === "per-method") {
        const bootData = {
          program: content.program.program,
          linkedContentKind: content.linkedContentRef.kind,
        };
        storeActions.jrEditState.bootForProgram(bootData);
      }

      actions.noteLoadRequestOutcome("succeeded");
      storeActions.infoPanel.setActiveTabKey(initialTabKey);
    } catch (err) {
      // TODO: Is there anything more intelligent we can do as
      // far as reporting to the user is concerned?
      console.log(`error loading project ${projectId}:`, err);
      actions.noteLoadRequestOutcome("failed");
    }

    console.log("ensureSyncFromStorage(): leaving");
  }),

  doLinkedContentLoadTask: thunk(async (actions, taskDescriptor, helpers) => {
    const { projectId, linkedContentRef } = taskDescriptor;
    const initialState = helpers.getState().linkedContentLoadingState;

    const correctLoadIsPending =
      initialState.kind === "pending" && initialState.projectId === projectId;
    const correctLoadHasSucceeded =
      initialState.kind === "succeeded" && initialState.projectId === projectId;
    if (correctLoadIsPending || correctLoadHasSucceeded) {
      return;
    }

    actions.setLinkedContentLoadingState({
      kind: "pending",
      projectId,
      contentRef: linkedContentRef,
    });

    try {
      switch (linkedContentRef.kind) {
        case "none": {
          actions.setLinkedContentLoadingState({
            kind: "succeeded",
            projectId,
            content: { kind: "none" },
          });
          break;
        }
        case "jr-tutorial": {
          const name = linkedContentRef.name;
          const content = await jrTutorialContentFromName(name);

          const liveState = helpers.getState().linkedContentLoadingState;
          const requestStillWanted =
            liveState.kind === "pending" && liveState.projectId === projectId;
          if (!requestStillWanted) {
            break;
          }

          const linkedContent: LinkedContent = {
            kind: "jr-tutorial",
            content,
            interactionState: linkedContentRef.interactionState,
          };

          actions.setLinkedContentLoadingState({
            kind: "succeeded",
            projectId,
            content: linkedContent,
          });

          break;
        }
        case "specimen": {
          const contentHash = linkedContentRef.specimenContentHash;
          const relativePath = `_by_content_hash_/${contentHash}`;
          const lesson = await lessonDescriptorFromRelativePath(relativePath);

          const liveState = helpers.getState().linkedContentLoadingState;
          const requestStillWanted =
            liveState.kind === "pending" &&
            eqLinkedContentRefs(liveState.contentRef, linkedContentRef);
          if (!requestStillWanted) {
            break;
          }

          actions.setLinkedContentLoadingState({
            kind: "succeeded",
            projectId,
            content: { kind: "specimen", lesson },
          });
          break;
        }
        default:
          assertNever(linkedContentRef);
      }
    } catch (e) {
      console.error("doLinkedContentLoadTask():", e);
      actions.setLinkedContentLoadingState({ kind: "failed" });
    }
  }),

  syncAssetsFromStorage: thunk(async (actions, _voidPayload, helpers) => {
    // TODO: Does this have a race if the active project changes while
    // we're in the middle of working?

    // The assetServer is told about all assets afresh, one by one,
    // via the calls to AssetPresentation.create() below.  So clear
    // the asset-server before we start.
    assetServer.clear();

    const project = helpers.getState().project;
    failIfDummy(project, "syncAssetsFromStorage");

    const assets = await assetsInProject(project.id);
    const assetPresentations = await Promise.all(
      assets.map((a) => AssetPresentation.create(a))
    );

    actions.setAssets(assetPresentations);
  }),

  deactivate: thunk((actions) => {
    actions.syncDummyProject();
    assetServer.clear();
  }),

  addAssetAndSync: thunk(async (actions, descriptor, helpers) => {
    console.log(
      `adding asset ${descriptor.name}: ${descriptor.mimeType}` +
        ` (${descriptor.data.byteLength} bytes)`
    );

    const project = helpers.getState().project;
    failIfDummy(project, "addAssetAndSync");

    await addAssetToProject(
      project.id,
      descriptor.name,
      descriptor.mimeType,
      descriptor.data
    );

    await actions.syncAssetsFromStorage();

    helpers.getStoreActions().projectCollection.noteDatabaseChange();
  }),

  deleteAssetAndSync: thunk(async (actions, descriptor, helpers) => {
    const project = helpers.getState().project;
    failIfDummy(project, "deleteAssetAndSync");

    await deleteAssetFromProject(project.id, descriptor.name);
    await actions.syncAssetsFromStorage();
    helpers.getStoreActions().projectCollection.noteDatabaseChange();
  }),

  renameAssetAndSync: thunk(async (actions, descriptor, helpers) => {
    const project = helpers.getState().project;
    failIfDummy(project, "renameAssetAndSync");

    const oldName = `${descriptor.fixedPrefix}${descriptor.oldNameSuffix}`;
    const newName = `${descriptor.fixedPrefix}${descriptor.newNameSuffix}`;

    try {
      await renameAssetInProject(project.id, oldName, newName);
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      err: any
    ) {
      if (err.name === "PytchDuplicateAssetNameError") {
        const opContext = descriptor.operationContext;
        throw new Error(
          `Cannot rename "${descriptor.oldNameSuffix}"` +
            ` to "${descriptor.newNameSuffix}" because` +
            ` ${opContext.scope} already contains` +
            ` ${opContext.assetIndefinite} called` +
            ` "${descriptor.newNameSuffix}".`
        );
      } else {
        throw err;
      }
    }

    await actions.syncAssetsFromStorage();

    helpers.getStoreActions().projectCollection.noteDatabaseChange();
  }),

  // This Action lives within activeProject but the project containing
  // the asset whose transform is to be updated is identified by a
  // property ("projectId") of the descriptor.  Seems clunky; revisit?
  updateAssetTransformAndSync: thunk(async (actions, descriptor, helpers) => {
    await updateAssetTransform(
      descriptor.projectId,
      descriptor.assetName,
      descriptor.newTransform
    );
    await actions.syncAssetsFromStorage();
    helpers.getStoreActions().projectCollection.noteDatabaseChange();
  }),

  requestSyncToStorage: thunk(async (actions, _payload, helpers) => {
    const project = helpers.getState().project;
    const projectId = project.id;

    const previousSaveRequest = helpers.getState().latestSaveRequest;
    const ourSeqnum = previousSaveRequest.seqnum + 1;

    console.log("requestSyncToStorage(): starting; seqnum", ourSeqnum);
    actions.noteSaveRequest({ projectId, seqnum: ourSeqnum, state: "pending" });

    await updateProject(
      projectId,
      project.program,
      project.trackedTutorial?.activeChapterIndex
    );

    helpers.getStoreActions().projectCollection.noteDatabaseChange();

    const liveSaveRequest = helpers.getState().latestSaveRequest;
    if (liveSaveRequest.seqnum === ourSeqnum) {
      console.log(`requestSyncToStorage(): noting success for ${ourSeqnum}`);
      actions.noteSaveRequestOutcome("succeeded");
      actions.noteCodeSaved();
    }
    console.log("requestSyncToStorage(): leaving");
  }),

  replaceTutorialAndSyncCode: action((state, trackedTutorial) => {
    let project = state.project;
    failIfDummy(project, "replaceTutorialAndSyncCode");

    project.trackedTutorial = trackedTutorial;

    const tutorialContent = trackedTutorial.content;
    if (tutorialContent.workInProgressChapter != null) {
      const newCode = codeJustBeforeWipChapter(tutorialContent);
      project.program = PytchProgramOps.fromPythonCode(newCode);
    }
  }),

  handleLiveReloadMessage: thunk((actions, messageString, helpers) => {
    const { appendTimestamped } = helpers.getStoreActions().editorWebSocketLog;

    const message = JSON.parse(messageString) as ILiveReloadMessage;

    switch (message.kind) {
      case "info": {
        appendTimestamped(`server:info: ${message.message}`);
        break;
      }
      case "code": {
        const codeText: string = message.text;
        appendTimestamped(`server:code: update of length ${codeText.length}`);

        actions.setCodeTextAndBuild({
          codeText,
          focusDestination: "running-project",
        });

        break;
      }
      case "tutorial": {
        // Is there a better way of doing this than parsing the HTML text twice?
        const tutorialBody = parsedHtmlBody(message.text, "live-reload");
        const tutorialDiv = tutorialBody.childNodes[0] as HTMLDivElement;
        const meta = JSON.parse(tutorialDiv.dataset.metadataJson ?? "{}");
        const programKind = (meta.programKind ?? "flat") as PytchProgramKind;

        switch (programKind) {
          case "flat": {
            const newContent = tutorialContentFromHTML(
              message.tutorial_name,
              message.text
            );
            const wipChapter = newContent.workInProgressChapter;
            appendTimestamped(
              `server:tutorial: update; ${newContent.chapters.length} chapter/s` +
                (wipChapter != null
                  ? `; working on chapter ${wipChapter}` +
                    ` "${newContent.chapters[wipChapter].title}"`
                  : "")
            );
            const newTrackedTutorial = {
              content: newContent,
              activeChapterIndex: wipChapter ?? 0,
            };
            actions.replaceTutorialAndSyncCode(newTrackedTutorial);
            break;
          }
          case "per-method": {
            const newContent = jrTutorialContentFromHTML(
              message.tutorial_name,
              message.text,
              "LIVE-RELOAD-MESSAGE"
            );
            actions.setLinkedLessonContent(newContent);
            break;
          }
          default:
            assertNever(programKind);
        }
        break;
      }
      default:
        // If we keep our promise to TypeScript that the message string can be
        // parsed into an ILiveReloadMessage, then this can never happen, but we
        // might inadvertently break that promise one day.
        assertNever(message);
    }
  }),

  handleLiveReloadError: thunk((_actions, _voidPayload, helpers) => {
    const { appendTimestamped } = helpers.getStoreActions().editorWebSocketLog;
    appendTimestamped(
      `error with websocket connection;` +
        ` ensure server is running at ${liveReloadURL}`
    );
  }),

  setActiveTutorialChapter: action((state, chapterIndex) => {
    const project = state.project;
    failIfDummy(project, "setActiveTutorialChapter");

    const trackedTutorial = failIfNull(
      project.trackedTutorial,
      "cannot set active tutorial chapter if project is not tracking a tutorial"
    );

    trackedTutorial.activeChapterIndex = chapterIndex;
    state.tutorialNavigationSeqnum += 1;
  }),

  incrementBuildSeqnum: action((state) => {
    state.buildSeqnum += 1;
  }),

  build: thunk(
    async (actions, focusDestination, helpers): Promise<BuildOutcome> => {
      const project = helpers.getState().project;
      failIfDummy(project, "build");

      const storeActions = helpers.getStoreActions();

      // TODO: Some flakiness observed in cy:parallel runs, suspected
      // race between clearing and starting to add to the stdout text.
      storeActions.standardOutputPane.clear();
      storeActions.errorReportList.clear();

      const appendOutput = storeActions.standardOutputPane.append;
      const appendError = storeActions.errorReportList.append;

      // Switch both UIs to the "errors" pane; the one we're not using
      // won't mind.
      const switchToErrorPane = () => {
        storeActions.infoPanel.setActiveTabKey("errors");
        storeActions.jrEditState.expandAndSetActive("errors");
      };

      const ensureNotFullScreen = storeActions.ideLayout.ensureNotFullScreen;

      // TODO: Types for args.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recordError = (pytchError: any, errorContext: any) => {
        console.log("build.recordError():", pytchError, errorContext);
        appendError({ pytchError, errorContext: errorContext });
        switchToErrorPane();
      };

      // Do this directly rather than via the action, because we don't
      // want the IDE to re-render with its 'Saving...' overlay and the
      // reset of the current live Skulpt project.
      await updateProject(
        project.id,
        project.program,
        project.trackedTutorial?.activeChapterIndex
      );
      // which does mean we need to do this bit ourselves too, ugh:
      helpers.getStoreActions().projectCollection.noteDatabaseChange();

      const buildOutcome = await build(project, appendOutput, recordError);

      const outcomeKind = BuildOutcomeKindOps.displayName(buildOutcome.kind);
      const eventData = JSON.stringify(project.program);
      fireAndForgetEvent(`build-${outcomeKind}`, eventData);

      console.log("build outcome:", buildOutcome);

      if (buildOutcome.kind === BuildOutcomeKind.Success) {
        switch (focusDestination) {
          case "running-project":
            document.getElementById("pytch-speech-bubbles")?.focus();
            break;
          case "editor":
            getFlatAceController()?.focus();
            break;
        }
      }

      if (buildOutcome.kind === BuildOutcomeKind.Failure) {
        const buildError = buildOutcome.error;
        if (buildError.tp$name !== "PytchBuildError") {
          throw Error(
            `error thrown during build was ${buildError.tp$name} not PytchBuildError`
          );
        }

        if (buildError.innerError.tp$name === "TigerPythonSyntaxAnalysis") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          buildError.innerError.syntax_errors.forEach((err: any) => {
            recordError(err, {
              kind: "build",
              phase: buildError.phase,
              phaseDetail: buildError.phaseDetail,
            });
          });
        } else {
          recordError(buildError.innerError, {
            kind: "build",
            phase: buildError.phase,
            phaseDetail: buildError.phaseDetail,
          });
        }

        ensureNotFullScreen("force-wide-info-pane");
      }

      actions.incrementBuildSeqnum();
      actions.noteCodeSaved();
      storeActions.ideLayout.maybeAdvanceTour("green-flag");

      return buildOutcome;
    }
  ),

  ////////////////////////////////////////////////////////////////////////
  // Background sync

  nPendingSyncActions: 0,
  pendingSyncActionsExist: computed((state) => state.nPendingSyncActions > 0),
  increaseNPendingSyncActions: action((state, nActionsIncrease) => {
    state.nPendingSyncActions += nActionsIncrease;
    if (state.nPendingSyncActions < 0) {
      console.warn(
        `nPendingSyncActions = ${state.nPendingSyncActions} < 0;` +
          " clamping to zero"
      );
      state.nPendingSyncActions = 0;
    }
  }),
};
