import { IAssetInProject } from "./asset";

// TODO: Move LoadingState somewhere central?
import { LoadingState } from "./projects";
import { Action, action, Thunk, thunk } from "easy-peasy";
import { loadContent } from "../database/projects";

export interface IProjectContent {
    id: string;
    codeText: string;
    assets: Array<IAssetInProject>;
}

export type IMaybeProject = IProjectContent | null;

// TODO: Eliminate dup'd code for loading-state?
export interface IActiveProject {
    loadingState: LoadingState;
    project: IMaybeProject;
    initialiseContent: Action<IActiveProject, IProjectContent>,
    loadingPending: Action<IActiveProject>,
    activate: Thunk<IActiveProject, string>;
    deactivate: Action<IActiveProject>;
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
        // TODO: Assets
    }),

    deactivate: action((state) => {
        state.project = null;
        state.loadingState = LoadingState.Idle;
    }),
};
