import { IAssetInProject } from "./asset";

// TODO: Move LoadingState somewhere central?
import { LoadingState } from "./projects";

export interface IProjectContent {
    id: string;
    codeText: string;
    assets: Array<IAssetInProject>;
}

export type IMaybeProject = IProjectContent | null;

export interface IActiveProject {
    loadingState: LoadingState;
    project: IMaybeProject;
}

export const activeProject: IActiveProject = {
    loadingState: LoadingState.Idle,
    project: null,
};
