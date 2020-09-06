import { IAssetInProject } from "./asset";

// TODO: Move LoadingState somewhere central?
import { ProjectId, ITrackedTutorial } from "./projects";
import { Action, action, Thunk, thunk, Computed, computed } from "easy-peasy";
import { batch } from "react-redux";
import {
  loadContent,
  addAssetToProject,
  updateCodeTextOfProject,
} from "../database/indexed-db";

import { build } from "../skulpt-connection/build";
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
  NoProject,
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
  codeSyncState: SyncState;
  assetsSyncState: SyncState;
  project: IMaybeProject;
  buildSeqnum: number;
  haveProject: Computed<IActiveProject, boolean>;

  codeTextOrPlaceholder: Computed<IActiveProject, string>;

  initialiseContent: Action<IActiveProject, IProjectContent>;

  updateSyncState: Action<IActiveProject, ISyncStateUpdate>;

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
  codeSyncState: SyncState.NoProject,
  assetsSyncState: SyncState.NoProject,
  project: null,
  buildSeqnum: 0,
  haveProject: computed((state) => state.project != null),

  codeTextOrPlaceholder: computed((state) => {
    if (state.project != null) {
      return state.project.codeText;
    }
    switch (state.codeSyncState) {
      case SyncState.NoProject:
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

  updateSyncState: action((state, update) => {
    switch (update.component) {
      case ProjectComponent.Code:
        state.codeSyncState = update.newState;
        break;
      case ProjectComponent.Assets:
        state.assetsSyncState = update.newState;
        break;
    }
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
    // for the async stuff.

    const content = await loadContent(projectId);
    console.log("activate(): about to do initialiseContent(...)");
    actions.initialiseContent(content);

    if (content.trackedTutorial != null) {
      const tutorial = content.trackedTutorial;
      const storeActions = helpers.getStoreActions();
      await storeActions.activeTutorial.requestSyncFromStorage(tutorial.slug);
      batch(() => {
        storeActions.activeTutorial.navigateToChapter(tutorial.chapterIndex);
        storeActions.infoPanel.setActiveTabKey("tutorial");
      });
    } else {
      const storeActions = helpers.getStoreActions();
      batch(() => {
        console.log("clearing active tutorial");
        storeActions.activeTutorial.clear();
        console.log("selecting ASSETS tab");
        storeActions.infoPanel.setActiveTabKey("assets");
      });
    }

    console.log("requestSyncFromStorage(): leaving");
  }),

  deactivate: action((state) => {
    state.project = null;
    state.codeSyncState = SyncState.NoProject;
    state.assetsSyncState = SyncState.NoProject;
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

    const appendOutput = helpers.getStoreActions().standardOutputPane.append;
    const buildResult = await build(maybeProject, appendOutput);
    console.log("build result:", buildResult);

    actions.incrementBuildSeqnum();
  }),
};
