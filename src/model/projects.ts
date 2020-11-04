import { Action, action, Thunk, thunk } from "easy-peasy";
import { batch } from "react-redux";
import raw from "raw.macro";

import {
  allProjectSummaries,
  createNewProject,
  deleteProject,
} from "../database/indexed-db";
import { failIfNull } from "../utils";

import { TutorialId, ITutorialContent } from "./tutorial";

export type ProjectId = number;

export interface ITrackedTutorialRef {
  slug: TutorialId;
  activeChapterIndex: number;
}

export interface ITrackedTutorial {
  content: ITutorialContent;
  activeChapterIndex: number;
}

export interface ITutorialTrackingUpdate {
  projectId: ProjectId;
  chapterIndex: number;
}

// Currently, the "summary" property is only used for tutorial-following
// project, but the idea is that the user will in due course be able to
// provide a summary.
//
export interface IProjectSummary {
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
  setAvailable: Action<IProjectCollection, Array<IProjectSummary>>;
  loadSummaries: Thunk<IProjectCollection>;
  addProject: Action<IProjectCollection, IProjectSummary>;
  createNewProject: Thunk<IProjectCollection, string>;
  requestDeleteProjectThenResync: Thunk<IProjectCollection, ProjectId>;

  updateTutorialChapter: Action<IProjectCollection, ITutorialTrackingUpdate>;
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

  setAvailable: action((state, summaries) => {
    state.available = summaries;
  }),

  loadSummaries: thunk(async (actions) => {
    actions.loadingPending();
    const summaries = await allProjectSummaries();
    batch(() => {
      actions.setAvailable(summaries);
      actions.loadingSucceeded();
    });
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
    // This is read at build time:
    const skeletonCodeText = raw("../assets/skeleton-project.py");

    const newProject = await createNewProject(
      name,
      undefined,
      undefined,
      skeletonCodeText
    );

    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);
    return newProject;
  }),

  requestDeleteProjectThenResync: thunk(async (actions, projectId) => {
    await deleteProject(projectId);
    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);
  }),

  updateTutorialChapter: action((state, trackingUpdate) => {
    const targetProjectId = trackingUpdate.projectId;
    const project = failIfNull(
      state.available.find((p) => p.id === targetProjectId),
      `could not find project ${targetProjectId} to update`
    );
    const trackedTutorial = failIfNull(
      project.trackedTutorial,
      `project ${targetProjectId} is not tracking a tutorial`
    );

    trackedTutorial.activeChapterIndex = trackingUpdate.chapterIndex;
  }),
};
