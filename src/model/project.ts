import { IAssetInProject, AssetPresentation } from "./asset";

import { ProjectId, ITrackedTutorial } from "./projects";
import { Action, action, Thunk, thunk, Computed, computed } from "easy-peasy";
import { batch } from "react-redux";
import {
  projectDescriptor,
  addAssetToProject,
  updateCodeTextOfProject,
  updateTutorialChapter,
  assetsInProject,
  deleteAssetFromProject,
  renameAssetInProject,
} from "../database/indexed-db";

import {
  build,
  BuildOutcomeKind,
  BuildOutcome,
} from "../skulpt-connection/build";
import { IPytchAppModel } from ".";
import { assetServer } from "../skulpt-connection/asset-server";
import { assertNever, failIfNull } from "../utils";
import { codeJustBeforeWipChapter, tutorialContentFromHTML } from "./tutorial";
import { liveReloadURL } from "../constants";
import { focusStage } from "../components/StageControls";

declare var Sk: any;

// TODO: Any way to avoid duplicating information between the
// 'descriptor' and the 'content'?  Should the Descriptor be defined
// by the database?
export interface IProjectDescriptor {
  id: ProjectId;
  codeText: string;
  assets: Array<IAssetInProject>;
  trackedTutorial?: ITrackedTutorial;
}

export interface IProjectContent {
  id: ProjectId;
  codeText: string;
  assets: Array<AssetPresentation>;
  trackedTutorial?: ITrackedTutorial;
}

// TODO: Add error message or similar to "failed".
type SyncRequestOutcome = "succeeded" | "failed";
type SyncRequestState = "pending" | SyncRequestOutcome;

interface ILoadSaveRequest {
  seqnum: number;
  state: SyncRequestState;
}

export interface ILoadSaveStatus {
  loadState: SyncRequestState;
  saveState: SyncRequestState;
}

export enum SyncState {
  SyncNotStarted,
  SyncingFromBackEnd,
  SyncingToBackEnd,
  Syncd,
  Error,
}

interface ISetCodeTextAndBuildPayload {
  codeText: string;
  thenGreenFlag: boolean;
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
  oldName: string;
  newName: string;
}

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

export interface IActiveProject {
  latestLoadRequest: ILoadSaveRequest;
  latestSaveRequest: ILoadSaveRequest;

  noteLoadRequest: Action<IActiveProject, ILoadSaveRequest>;
  noteLoadRequestOutcome: Action<IActiveProject, SyncRequestOutcome>;

  syncState: Computed<IActiveProject, ILoadSaveStatus>;
  project: IProjectContent;
  buildSeqnum: number;
  tutorialNavigationSeqnum: number;

  haveProject: Computed<IActiveProject, boolean>;

  codeTextOrPlaceholder: Computed<IActiveProject, string>;

  initialiseContent: Action<IActiveProject, IProjectContent>;
  setAssets: Action<IActiveProject, Array<AssetPresentation>>;

  requestSyncFromStorage: Thunk<IActiveProject, ProjectId, {}, IPytchAppModel>;
  syncAssetsFromStorage: Thunk<IActiveProject, void, {}, IPytchAppModel>;
  deactivate: Action<IActiveProject>;

  addAssetAndSync: Thunk<IActiveProject, IAddAssetDescriptor>;
  deleteAssetAndSync: Thunk<IActiveProject, IDeleteAssetDescriptor>;
  renameAssetAndSync: Thunk<IActiveProject, IRenameAssetDescriptor>;

  setCodeText: Action<IActiveProject, string>;
  setCodeTextAndBuild: Thunk<IActiveProject, ISetCodeTextAndBuildPayload>;
  requestSyncToStorage: Thunk<IActiveProject>;

  /** Replace the content and current chapter of the tutorial, syncing
   * the code to the code as of the end of the previous chapter.  Only
   * meant to be used as part of the support mechanism for tutorial
   * development with the live-reload watcher.
   */
  replaceTutorialAndSyncCode: Action<IActiveProject, ITrackedTutorial>;

  handleLiveReloadMessage: Thunk<IActiveProject, string, any, IPytchAppModel>;
  handleLiveReloadError: Thunk<IActiveProject, void, any, IPytchAppModel>;

  setActiveTutorialChapter: Action<IActiveProject, number>;

  incrementBuildSeqnum: Action<IActiveProject>;
  build: Thunk<IActiveProject, void, {}, IPytchAppModel>;
}

const codeTextNoProjectPlaceholder: string = "# -- no project yet --\n";
const codeTextLoadingPlaceholder: string = "# -- loading --\n";

const dummyProject: IProjectContent = {
  id: -1,
  codeText: "# [ This is not a real project.  Nobody should ever see this. ]",
  assets: [],
};

export const activeProject: IActiveProject = {
  latestLoadRequest: { seqnum: 1000, state: "succeeded" },
  latestSaveRequest: { seqnum: 1000, state: "succeeded" },

  noteLoadRequest: action((state, request) => {
    state.latestLoadRequest = request;
  }),
  noteLoadRequestOutcome: action((state, outcome) => {
    state.latestLoadRequest.state = outcome;
  }),

  syncState: computed((state) => ({
    loadState: state.latestLoadRequest.state,
    saveState: state.latestSaveRequest.state,
  })),

  project: dummyProject,
  buildSeqnum: 0,
  tutorialNavigationSeqnum: 0,

  haveProject: computed((state) => state.project != null),

  codeTextOrPlaceholder: computed((state) => {
    if (state.project != null) {
      return state.project.codeText;
    }
    switch (state.syncState) {
      case SyncState.SyncNotStarted:
        return codeTextNoProjectPlaceholder;
      case SyncState.SyncingFromBackEnd:
        return codeTextLoadingPlaceholder;
      default:
        return "# error?";
    }
  }),

  initialiseContent: action((state, content) => {
    if (state.project !== null) {
      throw Error("initialiseContent(): already have project");
    }
    if (state.syncState !== SyncState.SyncingFromBackEnd) {
      throw Error("initialiseContent(): should be in SyncingFromBackEnd");
    }
    state.project = content;
    state.syncState = SyncState.Syncd;
    console.log("have set project and set sync state");
  }),

  setAssets: action((state, assetPresentations) => {
    let project = failIfNull(state.project, "setAssets(): have no project");
    project.assets = assetPresentations;
  }),

  setCodeText: action((state, text) => {
    let project = failIfNull(
      state.project,
      "attempt to setCodeText on null project"
    );
    project.codeText = text;
  }),

  setCodeTextAndBuild: thunk(async (actions, payload) => {
    actions.setCodeText(payload.codeText);
    const buildOutcome = await actions.build();
    if (
      payload.thenGreenFlag &&
      buildOutcome.kind === BuildOutcomeKind.Success
    ) {
      if (
        Sk.pytch.current_live_project ===
        Sk.default_pytch_environment.current_live_project
      ) {
        console.log(
          "code built successfully but now have no real live project"
        );
      } else {
        Sk.pytch.current_live_project.on_green_flag_clicked();
        focusStage();
      }
    }
  }),

  // TODO: The interplay between activate and deactivate will
  // need more attention I think.  Behaviour needs to be sane
  // if the user clicks on a project, goes back to list before
  // it's loaded, then clicks on a different project.
  requestSyncFromStorage: thunk(async (actions, projectId, helpers) => {
    console.log("requestSyncFromStorage(): starting for", projectId);

    const previousLoadRequest = helpers.getState().latestLoadRequest;

    const ourSeqnum = previousLoadRequest.seqnum + 1;
    console.log("requestSyncFromStorage(): starting; seqnum", ourSeqnum);

    actions.noteLoadRequest({ seqnum: ourSeqnum, state: "pending" });

    const storeActions = helpers.getStoreActions();

    batch(() => {
      storeActions.standardOutputPane.clear();
      storeActions.errorReportList.clear();
    });

    const descriptor = await projectDescriptor(projectId);
    const initialTabKey =
      descriptor.trackedTutorial != null ? "tutorial" : "assets";

    assetServer.prepare(descriptor.assets);

    const assetPresentations = await Promise.all(
      descriptor.assets.map((a) => AssetPresentation.create(a))
    );

    const content: IProjectContent = {
      id: descriptor.id,
      assets: assetPresentations,
      codeText: descriptor.codeText,
      trackedTutorial: descriptor.trackedTutorial,
    };

    // We now have everything we need.  Is the caller still interested
    // in it?  The live load request might have been re-assigned, so
    // re-extract it:
    const liveLoadRequest = helpers.getState().latestLoadRequest;
    if (liveLoadRequest.seqnum !== ourSeqnum) {
      console.log(
        "requestSyncFromStorage():" +
          ` live seqnum is ${liveLoadRequest.seqnum}` +
          ` but we are working on ${ourSeqnum}; abandoning`
      );
      return;
    }

    batch(() => {
      actions.initialiseContent(content);
      if (content.trackedTutorial != null) {
        actions.setActiveTutorialChapter(
          content.trackedTutorial.activeChapterIndex
        );
      }
      actions.noteLoadRequestOutcome("succeeded");
      storeActions.infoPanel.setActiveTabKey(initialTabKey);
    });

    console.log("requestSyncFromStorage(): leaving");
  }),

  syncAssetsFromStorage: thunk(async (actions, _voidPayload, helpers) => {
    const projectId = failIfNull(
      helpers.getState().project?.id,
      "cannot re-sync assets from storage if null project"
    );

    const assets = await assetsInProject(projectId);
    const assetPresentations = await Promise.all(
      assets.map((a) => AssetPresentation.create(a))
    );

    actions.setAssets(assetPresentations);
  }),

  deactivate: action((state) => {
    state.project = null;
    state.syncState = SyncState.SyncNotStarted;
    assetServer.clear();
  }),

  addAssetAndSync: thunk(async (actions, descriptor, helpers) => {
    console.log(
      `adding asset ${descriptor.name}: ${descriptor.mimeType}` +
        ` (${descriptor.data.byteLength} bytes)`
    );

    const state = helpers.getState();
    const project = failIfNull(
      state.project,
      "attempt to sync code of null project"
    );

    const projectId = project.id;

    await addAssetToProject(
      projectId,
      descriptor.name,
      descriptor.mimeType,
      descriptor.data
    );

    await actions.syncAssetsFromStorage();
  }),

  deleteAssetAndSync: thunk(async (actions, descriptor, helpers) => {
    const project = failIfNull(
      helpers.getState().project,
      "attempt to delete asset of null project"
    );

    await deleteAssetFromProject(project.id, descriptor.name);
    await actions.syncAssetsFromStorage();
  }),

  renameAssetAndSync: thunk(async (actions, descriptor, helpers) => {
    const project = failIfNull(
      helpers.getState().project,
      "attempt to rename asset in null project"
    );

    await renameAssetInProject(
      project.id,
      descriptor.oldName,
      descriptor.newName
    );
    await actions.syncAssetsFromStorage();
  }),

  requestSyncToStorage: thunk(async (actions, _payload, helpers) => {
    const project = helpers.getState().project;

    actions.setSyncState(SyncState.SyncingToBackEnd);
    if (project.trackedTutorial != null) {
      await updateTutorialChapter({
        projectId: project.id,
        chapterIndex: project.trackedTutorial.activeChapterIndex,
      });
    }
    await updateCodeTextOfProject(project.id, project.codeText);
    actions.setSyncState(SyncState.Syncd);
  }),

  replaceTutorialAndSyncCode: action((state, trackedTutorial) => {
    let project = failIfNull(
      state.project,
      "cannot replace tutorial if no active project"
    );
    project.trackedTutorial = trackedTutorial;

    const tutorialContent = trackedTutorial.content;
    if (tutorialContent.workInProgressChapter != null) {
      const newCode = codeJustBeforeWipChapter(tutorialContent);
      project.codeText = newCode;
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
          thenGreenFlag: true,
        });

        break;
      }
      case "tutorial": {
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
    const project = failIfNull(
      state.project,
      "cannot set active tutorial chapter if no project"
    );
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
    async (actions, payload, helpers): Promise<BuildOutcome> => {
      const project = failIfNull(
        helpers.getState().project,
        "cannot build if no project"
      );

      const storeActions = helpers.getStoreActions();

      batch(() => {
        storeActions.standardOutputPane.clear();
        storeActions.errorReportList.clear();
      });

      const appendOutput = storeActions.standardOutputPane.append;
      const appendError = storeActions.errorReportList.append;
      const switchToErrorPane = () =>
        storeActions.infoPanel.setActiveTabKey("errors");

      // TODO: Types for args.
      const recordError = (pytchError: any, errorContext: any) => {
        console.log("build.recordError():", pytchError, errorContext);
        appendError({ pytchError, errorContext: errorContext });
        switchToErrorPane();
      };

      const buildOutcome = await build(project, appendOutput, recordError);
      console.log("build outcome:", buildOutcome);

      if (buildOutcome.kind === BuildOutcomeKind.Failure) {
        const buildError = buildOutcome.error;
        if (buildError.tp$name !== "PytchBuildError") {
          throw Error("error thrown during build was not PytchBuildError");
        }

        recordError(buildError.innerError, {
          kind: "build",
          phase: buildError.phase,
          phaseDetail: buildError.phaseDetail,
        });
      }

      actions.incrementBuildSeqnum();

      return buildOutcome;
    }
  ),
};
