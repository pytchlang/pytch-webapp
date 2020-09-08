import { IAssetInProject } from "./asset";

// TODO: Move LoadingState somewhere central?
import { ProjectId, ITrackedTutorial } from "./projects";
import { Action, action, Thunk, thunk, Computed, computed } from "easy-peasy";
import { batch } from "react-redux";
import {
  projectContent,
  addAssetToProject,
  updateCodeTextOfProject,
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

export enum ProjectComponent {
  Code,
  Assets,
}

export enum SyncState {
  SyncNotStarted,
  SyncingFromStorage,
  SyncingToStorage,
  Syncd,
  Error,
}

export interface ISyncStateUpdate {
  component: ProjectComponent;
  newState: SyncState;
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
  requestCodeSyncToStorage: Thunk<IActiveProject>;

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
    switch (state.codeSyncState) {
      case SyncState.SyncNotStarted:
        return codeTextNoProjectPlaceholder;
      case SyncState.SyncingFromStorage:
        return codeTextLoadingPlaceholder;
      default:
        return "# error?";
    }
  }),

  initialiseContent: action((state, content) => {
    if (state.project !== null) {
      throw Error("already have project when trying to init");
    }
    state.project = content;
    state.codeSyncState = SyncState.Syncd;
    state.assetsSyncState = SyncState.Syncd;
    console.log("have set project and set sync states");
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
    console.log("activate()", projectId);

    actions.updateSyncState({
      component: ProjectComponent.Code,
      newState: SyncState.SyncingFromStorage,
    });
    actions.updateSyncState({
      component: ProjectComponent.Assets,
      newState: SyncState.SyncingFromStorage,
    });

    // TODO: Can we reduce flickering?  It's a bit distracting.  Might
    // be enough to batch() a few things and choose the order carefully
    // for the async stuff.  Might need to do something other than just
    // navigate() to the project IDE on click.  Does need to look OK both
    // if a user visits the url "/ide/34" directly or if they get there
    // by a click on a project summary card.

    const content = await projectContent(projectId);
    console.log("activate(): about to do initialiseContent(...)");
    actions.initialiseContent(content);

    const storeActions = helpers.getStoreActions();

    if (content.trackedTutorial != null) {
      const tutorial = content.trackedTutorial;
      await storeActions.activeTutorial.requestSyncFromStorage(tutorial.slug);
      batch(() => {
        storeActions.activeTutorial.navigateToChapter(tutorial.chapterIndex);
        storeActions.infoPanel.setActiveTabKey("tutorial");
      });
    } else {
      batch(() => {
        console.log("clearing active tutorial");
        storeActions.activeTutorial.clear();
        console.log("selecting ASSETS tab");
        storeActions.infoPanel.setActiveTabKey("assets");
      });

      storeActions.standardOutputPane.clear();
      storeActions.errorReportList.clear();
    }

    console.log("requestSyncFromStorage(): leaving");
  }),

  deactivate: action((state) => {
    state.project = null;
    state.codeSyncState = SyncState.SyncNotStarted;
    state.assetsSyncState = SyncState.SyncNotStarted;
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

    actions.updateSyncState({
      component: ProjectComponent.Assets,
      newState: SyncState.SyncingToStorage,
    });

    const assetInProject = await addAssetToProject(
      projectId,
      payload.name,
      payload.mimeType,
      payload.data
    );
    actions.addAsset(assetInProject);

    actions.updateSyncState({
      component: ProjectComponent.Assets,
      newState: SyncState.Syncd,
    });
  }),

  addAsset: action((state, assetInProject) => {
    if (state.project == null)
      throw Error("attempt to add asset to null project");
    state.project.assets.push(assetInProject);
  }),

  requestCodeSyncToStorage: thunk(async (actions, payload, helpers) => {
    const state = helpers.getState();
    if (state.project == null) {
      throw Error("attempt to sync code of null project");
    }
    actions.updateSyncState({
      component: ProjectComponent.Code,
      newState: SyncState.SyncingToStorage,
    });
    await updateCodeTextOfProject(state.project.id, state.project.codeText);
    actions.updateSyncState({
      component: ProjectComponent.Code,
      newState: SyncState.Syncd,
    });
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

    storeActions.standardOutputPane.clear();
    storeActions.errorReportList.clear();

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

    if (buildResult.kind == BuildOutcomeKind.Failure) {
      const appendError = helpers.getStoreActions().errorReportList.append;
      appendError({
        threadInfo: null,
        pytchError: buildResult.error,
      });
    }

    actions.incrementBuildSeqnum();
  }),
};
