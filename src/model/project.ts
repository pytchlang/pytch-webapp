import { IAssetInProject } from "./asset";

// TODO: Move LoadingState somewhere central?
import { LoadingState } from "./projects";
import { Action, action, Thunk, thunk } from "easy-peasy";
import { loadContent, addAssetToProject } from "../database/projects";

export interface IProjectContent {
    id: string;
    codeText: string;
    assets: Array<IAssetInProject>;
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
    initialiseContent: Action<IActiveProject, IProjectContent>,

    updateSyncState: Action<IActiveProject, ISyncStateUpdate>,

    requestSyncFromStorage: Thunk<IActiveProject, ProjectId>;
    deactivate: Action<IActiveProject>;

    // Storage of the asset to the backend and sync of the asset-in-project
    // are tied together here.
    requestAddAssetAndSync: Thunk<IActiveProject, IRequestAddAssetPayload>;
    addAsset: Action<IActiveProject, IAssetInProject>;
}

export const activeProject: IActiveProject = {
    codeSyncState: SyncState.NoProject,
    assetsSyncState: SyncState.NoProject,
    project: null,

    initialiseContent: action((state, content) => {
        if (state.project !== null) {
            throw Error("already have project when trying to init");
        }
        state.project = content;
        state.codeSyncState = SyncState.Syncd;
        state.assetsSyncState = SyncState.Syncd;
        console.log("have set project and set sync states");
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
    requestSyncFromStorage: thunk(async (actions, projectId) => {
        console.log("activate()", projectId);

        actions.updateSyncState({
            component: ProjectComponent.Code,
            newState: SyncState.SyncingFromStorage,
        });
        actions.updateSyncState({
            component: ProjectComponent.Assets,
            newState: SyncState.SyncingFromStorage,
        });

        const content = await loadContent(projectId);
        console.log(`activate(): about to do initialiseContent("${content.codeText}")`);
        actions.initialiseContent(content);
    }),

    deactivate: action((state) => {
        state.project = null;
        state.loadingState = LoadingState.Idle;
    }),

    requestAddAssetAndSync: thunk(async (actions, payload, helpers) => {
        console.log(`adding asset ${payload.name}: ${payload.mimeType} (${payload.data.byteLength} bytes)`);

        const state = helpers.getState();
        if (state.project == null) {
            throw Error("attempt to sync code of null project");
        }

        const projectId = state.project.id;

        actions.updateSyncState({
            component: ProjectComponent.Assets,
            newState: SyncState.SyncingToStorage,
        });

        const assetInProject = await addAssetToProject(projectId,
                                                       payload.name,
                                                       payload.mimeType,
                                                       payload.data);
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
};
