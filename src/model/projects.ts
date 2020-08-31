import { Action, action } from "easy-peasy";

export interface IProjectSummary {
  // TODO: Is this the right place to note whether a project
  // is tracking a tutorial?  Or a separate 'ProjectTutorialBookmark'
  // 'table', thinking in the relational way?

  id: string;
  name: string;
  summary?: string;
}

export enum LoadingState {
  Idle,
  Pending,
  Succeeded,
  Failed,
}

export interface IProjectCollection {
  loadingState: LoadingState,
  available: Array<IProjectSummary>;

  loadingPending: Action<IProjectCollection>,
  loadingSucceeded: Action<IProjectCollection>,
  addProject: Action<IProjectCollection, IProjectSummary>;
}

export const projectCollection: IProjectCollection = {
  loadingState: LoadingState.Idle,
  available: [],

  loadingPending: action((state) => {
     state.loadingState = LoadingState.Pending;
  }),
  loadingSucceeded: action((state) => {
    state.loadingState = LoadingState.Succeeded;
  }),

  addProject: action((state, projectSummary) => {
    // TODO: Assert that new project's ID is not already known to us?
    console.log("addProject(): adding", projectSummary.name);
    state.available.push(projectSummary);
  }),
};
