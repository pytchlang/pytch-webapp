import { IAssetInProject } from "./asset";

// TODO: Move LoadingState somewhere central?
import { ProjectId, ITrackedTutorial } from "./projects";
import { Action, action, Thunk, thunk, Computed, computed } from "easy-peasy";
import { batch } from "react-redux";
import {
  projectContent,
  addAssetToProject,
  updateCodeTextOfProject,
  updateTutorialChapter,
} from "../database/indexed-db";

import { build, BuildOutcomeKind } from "../skulpt-connection/build";
import { IPytchAppModel } from ".";

export interface IProjectContent {
  id: ProjectId;
  codeText: string;
  assets: Array<IAssetInProject>;
  trackedTutorial?: ITrackedTutorial;
}

export type IMaybeProject = IProjectContent | null;

interface IRequestAddAssetPayload {
  name: string;
  mimeType: string;
  data: ArrayBuffer;
}

export enum SyncState {
  SyncNotStarted,
  SyncingFromBackEnd,
  SyncingToBackEnd,
  Syncd,
  Error,
}

// TODO: Eliminate dup'd code for loading-state?
export interface IActiveProject {
  syncState: SyncState;
  project: IMaybeProject;
  buildSeqnum: number;
  haveProject: Computed<IActiveProject, boolean>;

  codeTextOrPlaceholder: Computed<IActiveProject, string>;

  initialiseContent: Action<IActiveProject, IProjectContent>;

  setSyncState: Action<IActiveProject, SyncState>;

  requestSyncFromStorage: Thunk<IActiveProject, ProjectId, {}, IPytchAppModel>;
  deactivate: Action<IActiveProject>;

  // Storage of the asset to the backend and sync of the asset-in-project
  // are tied together here.
  requestAddAssetAndSync: Thunk<IActiveProject, IRequestAddAssetPayload>;
  addAsset: Action<IActiveProject, IAssetInProject>;

  setCodeText: Action<IActiveProject, string>;
  requestCodeSyncToStorage: Thunk<IActiveProject>; // TODO Rename 'requestSyncToStorage' or even '...BackEnd'

  setActiveTutorialChapter: Action<IActiveProject, number>;

  incrementBuildSeqnum: Action<IActiveProject>;
  build: Thunk<IActiveProject, void, {}, IPytchAppModel>;
}

const codeTextNoProjectPlaceholder: string = "# -- no project yet --\n";
const codeTextLoadingPlaceholder: string = "# -- loading --\n";

export const activeProject: IActiveProject = {
  syncState: SyncState.SyncNotStarted,
  project: null,
  buildSeqnum: 0,
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

  setCodeText: action((state, text) => {
    if (state.project == null) {
      throw Error("attempt to setCodeText on null project");
    }
    state.project.codeText = text;
  }),

  setSyncState: action((state, syncState) => {
    state.syncState = syncState;
  }),

  // TODO: The interplay between activate and deactivate will
  // need more attention I think.  Behaviour needs to be sane
  // if the user clicks on a project, goes back to list before
  // it's loaded, then clicks on a different project.
  requestSyncFromStorage: thunk(async (actions, projectId, helpers) => {
    console.log("requestSyncFromStorage(): starting for", projectId);

    const storeActions = helpers.getStoreActions();

    batch(() => {
      actions.setSyncState(SyncState.SyncingFromBackEnd);
      storeActions.standardOutputPane.clear();
      storeActions.errorReportList.clear();
    });

    // TODO: Can we reduce flickering?  It's a bit distracting.  Might
    // be enough to batch() a few things and choose the order carefully
    // for the async stuff.  Might need to do something other than just
    // navigate() to the project IDE on click.  Does need to look OK both
    // if a user visits the url "/ide/34" directly or if they get there
    // by a click on a project summary card.

    const content = await projectContent(projectId);
    const initialTabKey =
      content.trackedTutorial != null ? "tutorial" : "assets";

    batch(() => {
      actions.initialiseContent(content);
      if (content.trackedTutorial != null) {
        actions.setActiveTutorialChapter(
          content.trackedTutorial.activeChapterIndex
        );
      }
      actions.setSyncState(SyncState.Syncd);
      storeActions.infoPanel.setActiveTabKey(initialTabKey);
    });

    console.log("requestSyncFromStorage(): leaving");
  }),

  deactivate: action((state) => {
    state.project = null;
    state.syncState = SyncState.SyncNotStarted;
  }),

  requestAddAssetAndSync: thunk(async (actions, payload, helpers) => {
    console.log(
      `adding asset ${payload.name}: ${payload.mimeType} (${payload.data.byteLength} bytes)`
    );

    const state = helpers.getState();
    if (state.project == null) {
      throw Error("attempt to sync code of null project");
    }

    const projectId = state.project.id;

    actions.setSyncState(SyncState.SyncingToBackEnd);

    const assetInProject = await addAssetToProject(
      projectId,
      payload.name,
      payload.mimeType,
      payload.data
    );

    batch(() => {
      actions.addAsset(assetInProject);
      actions.setSyncState(SyncState.Syncd);
    });
  }),

  addAsset: action((state, assetInProject) => {
    if (state.project == null)
      throw Error("attempt to add asset to null project");
    state.project.assets.push(assetInProject);
  }),

  // TODO: Rename, because it also now does tutorial bookmark.
  requestCodeSyncToStorage: thunk(async (actions, payload, helpers) => {
    const state = helpers.getState();
    if (state.project == null) {
      throw Error("attempt to sync code of null project");
    }

    actions.setSyncState(SyncState.SyncingToBackEnd);
    if (state.project.trackedTutorial != null) {
      await updateTutorialChapter({
        projectId: state.project.id,
        chapterIndex: state.project.trackedTutorial.activeChapterIndex,
      });
    }
    await updateCodeTextOfProject(state.project.id, state.project.codeText);
    actions.setSyncState(SyncState.Syncd);
  }),

  setActiveTutorialChapter: action((state, chapterIndex) => {
    if (state.project == null) {
      throw Error("cannot set active tutorial chapter if no project");
    }

    if (state.project.trackedTutorial == null) {
      throw Error(
        "cannot set active tutorial chapter if project is not tracking a tutorial"
      );
    }

    state.project.trackedTutorial.activeChapterIndex = chapterIndex;
  }),

  incrementBuildSeqnum: action((state) => {
    state.buildSeqnum += 1;
  }),

  build: thunk(async (actions, payload, helpers) => {
    const maybeProject = helpers.getState().project;
    if (maybeProject == null) {
      throw Error("cannot build if no project");
    }

    const storeActions = helpers.getStoreActions();

    batch(() => {
      storeActions.standardOutputPane.clear();
      storeActions.errorReportList.clear();
    });

    const appendOutput = storeActions.standardOutputPane.append;
    const appendError = storeActions.errorReportList.append;
    const switchToErrorPane = () => {
      storeActions.infoPanel.setActiveTabKey("errors");
    };

    // TODO: Types for args.
    const recordError = (pytchError: any, threadInfo: any) => {
      console.log("build.recordError():", pytchError, threadInfo);
      appendError({ threadInfo, pytchError });
      switchToErrorPane();
    };

    const buildResult = await build(maybeProject, appendOutput, recordError);
    console.log("build result:", buildResult);

    if (buildResult.kind === BuildOutcomeKind.Failure) {
      const appendError = helpers.getStoreActions().errorReportList.append;
      appendError({
        threadInfo: null,
        pytchError: buildResult.error,
      });
    }

    actions.incrementBuildSeqnum();
  }),
};
