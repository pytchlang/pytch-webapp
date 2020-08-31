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
    projectId: string;
    name: string;
    mimeType: string;
    data: ArrayBuffer;
}

// TODO: Eliminate dup'd code for loading-state?
export interface IActiveProject {
    loadingState: LoadingState;
    project: IMaybeProject;
    initialiseContent: Action<IActiveProject, IProjectContent>,
    loadingPending: Action<IActiveProject>,
    activate: Thunk<IActiveProject, string>;
    deactivate: Action<IActiveProject>;
    requestAddAsset: Thunk<IActiveProject, IRequestAddAssetPayload>;
    addAsset: Action<IActiveProject, IAssetInProject>;
}

export const activeProject: IActiveProject = {
    loadingState: LoadingState.Idle,
    project: null,

    initialiseContent: action((state, content) => {
        if (state.project !== null) {
            throw Error("already have project when trying to init");
        }
        state.project = content;
        state.loadingState = LoadingState.Succeeded;
    }),

    loadingPending: action((state) => {
        state.loadingState = LoadingState.Pending;
    }),

    // TODO: The interplay between activate and deactivate will
    // need more attention I think.  Behaviour needs to be sane
    // if the user clicks on a project, goes back to list before
    // it's loaded, then clicks on a different project.
    activate: thunk(async (actions, projectId) => {
        console.log("activate()", projectId);
        actions.loadingPending();
        const content = await loadContent(projectId);
        console.log("activate(): initialiseContent", content.codeText);
        actions.initialiseContent(content);
    }),

    deactivate: action((state) => {
        state.project = null;
        state.loadingState = LoadingState.Idle;
    }),

    requestAddAsset: thunk(async (actions, payload) => {
        console.log(`adding asset ${payload.name}: ${payload.mimeType} (${payload.data.byteLength} bytes)`);
        const assetInProject = await addAssetToProject(payload.projectId,
                                                       payload.name,
                                                       payload.mimeType,
                                                       payload.data);
        actions.addAsset(assetInProject);
    }),

    addAsset: action((state, assetInProject) => {
        if (state.project == null)
            throw Error("no live project when adding asset");
        state.project.assets.push(assetInProject);
    })
};
