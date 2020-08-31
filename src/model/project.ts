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
    loadingPending: Action<IActiveProject>,
    loadingSucceeded: Action<IActiveProject>,
}

export const activeProject: IActiveProject = {
    loadingState: LoadingState.Idle,
    project: null,

    loadingPending: action((state) => {
        state.loadingState = LoadingState.Pending;
    }),

    loadingSucceeded: action((state) => {
        state.loadingState = LoadingState.Succeeded;
    }),
};
