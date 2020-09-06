import { Action, action, Thunk, thunk } from "easy-peasy";

import {
  loadAllSummaries,
  createNewProject,
  deleteProject,
} from "../database/indexed-db";

import { TutorialId } from "./tutorial";

export type ProjectId = number;

export interface ITrackedTutorial {
  slug: TutorialId;
  chapterIndex: number;
}

export interface ITutorialTrackingUpdate {
  projectId: ProjectId;
  chapterIndex: number;
}

export interface IProjectSummary {
  // TODO: Is this the right place to note whether a project
  // is tracking a tutorial?  Or a separate 'ProjectTutorialBookmark'
  // 'table', thinking in the relational way?

  id: ProjectId;
  name: string;
  summary?: string;
  trackedTutorial?: ITrackedTutorial;
}

export enum LoadingState {
  Idle,
  Pending,
  Succeeded,
  Failed,
}

export interface IProjectCollection {
  loadingState: LoadingState;
  available: Array<IProjectSummary>;

  loadingPending: Action<IProjectCollection>;
  loadingSucceeded: Action<IProjectCollection>;
  loadSummaries: Thunk<IProjectCollection>;
  addProject: Action<IProjectCollection, IProjectSummary>;
  createNewProject: Thunk<IProjectCollection, string>;
  requestDeleteProject: Thunk<IProjectCollection, ProjectId>;
  deleteProject: Action<IProjectCollection, ProjectId>;
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

  loadSummaries: thunk(async (actions) => {
    actions.loadingPending();
    const summaries = await loadAllSummaries();
    summaries.forEach((s) => actions.addProject(s));
    actions.loadingSucceeded();
  }),

  addProject: action((state, projectSummary) => {
    // TODO: Assert that new project's ID is not already known to us?
    console.log(
      "IProjectCollection.addProject(): adding",
      projectSummary.name,
      projectSummary.summary
    );
    state.available.push(projectSummary);
  }),

  createNewProject: thunk(async (actions, name) => {
    const project = await createNewProject(name);
    actions.addProject(project);
  }),

  requestDeleteProject: thunk(async (actions, projectId) => {
    await deleteProject(projectId);
    actions.deleteProject(projectId);
  }),

  deleteProject: action((state, projectId) => {
    state.available = state.available.filter((p) => p.id !== projectId);
  }),
};
