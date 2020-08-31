import { IAssetInProject } from "./asset";

// TODO: Move LoadingState somewhere central?
import { LoadingState } from "./projects";
import { Action, action, Thunk, thunk } from "easy-peasy";

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
    loadingSucceeded: Action<IActiveProject>,
}

export const activeProject: IActiveProject = {
    loadingState: LoadingState.Idle,
    project: null,

    initialiseContent: action((state, content) => {
        if (state.project !== null) {
            throw Error("already have project when trying to init");
        }
        state.project = content;
    }),

    loadingPending: action((state) => {
        state.loadingState = LoadingState.Pending;
    }),

    loadingSucceeded: action((state) => {
        state.loadingState = LoadingState.Succeeded;
    }),
};
