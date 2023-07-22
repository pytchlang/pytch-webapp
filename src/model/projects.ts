import { Action, action, computed, Computed, Thunk, thunk } from "easy-peasy";
import { batch } from "react-redux";
import templateCodeWithSampleCode from "../assets/skeleton-project.py?raw";

import {
  addRemoteAssetToProject,
  allProjectSummaries,
  copyProject,
  createNewProject,
  deleteManyProjects,
  renameProject,
} from "../database/indexed-db";
import { assertNever, failIfNull, propSetterAction } from "../utils";
import { urlWithinApp } from "../env-utils";

import { TutorialId } from "./tutorial";
import { IPytchAppModel } from ".";
import { ProjectId, ITrackedTutorial } from "./project-core";
import { PytchProgramOps } from "./pytch-program";

export type ProjectTemplateKind = "bare-bones" | "with-sample-code";

export interface ICreateProjectDescriptor {
  name: string;
  template: ProjectTemplateKind;
}

export interface ICopyProjectDescriptor {
  sourceProjectId: ProjectId;
  nameOfCopy: string;
}

export interface ITrackedTutorialRef {
  slug: TutorialId;
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

export interface IDisplayedProjectSummary {
  summary: IProjectSummary;
  isSelected: boolean;
}

export type LoadingStatus =
  | { kind: "pending"; seqnum: number }
  | { kind: "succeeded"; seqnum: number }
  | { kind: "failed"; seqnum: number };

export type RenameProjectArgs = {
  id: ProjectId;
  name: string; // "Old name" or "new name" depending on usage
};

export interface IProjectCollection {
  available: Array<IDisplayedProjectSummary>;
  loadingStatus: LoadingStatus;
  setLoadingStatus: Action<IProjectCollection, LoadingStatus>;
  loadSeqnumNeeded: number;
  noteDatabaseChange: Action<IProjectCollection>;

  setAvailable: Action<IProjectCollection, Array<IProjectSummary>>;
  loadSummaries: Thunk<IProjectCollection>;
  addProject: Action<IProjectCollection, IProjectSummary>;
  createNewProject: Thunk<IProjectCollection, ICreateProjectDescriptor>;
  requestCopyProjectThenResync: Thunk<
    IProjectCollection,
    ICopyProjectDescriptor,
    void,
    IPytchAppModel,
    Promise<ProjectId>
  >;
  requestDeleteManyProjectsThenResync: Thunk<
    IProjectCollection,
    Array<ProjectId>
  >;
  requestRenameProjectThenResync: Thunk<IProjectCollection, RenameProjectArgs>;

  availableSelectedIds: Computed<IProjectCollection, Array<number>>;
  toggleProjectSelected: Action<IProjectCollection, ProjectId>;
  clearAllSelected: Action<IProjectCollection>;

  updateTutorialChapter: Action<IProjectCollection, ITutorialTrackingUpdate>;
}

export const projectCollection: IProjectCollection = {
  available: [],
  loadingStatus: { kind: "failed", seqnum: -1 },
  setLoadingStatus: propSetterAction("loadingStatus"),

  loadSeqnumNeeded: 7800,
  noteDatabaseChange: action((state) => {
    ++state.loadSeqnumNeeded;
  }),

  setAvailable: action((state, summaries) => {
    state.available = summaries.map((summary) => ({
      summary,
      isSelected: false,
    }));
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
    state.available.push({ summary: projectSummary, isSelected: false });
  }),

  createNewProject: thunk(async (actions, descriptor) => {
    const templateContent = (() => {
      switch (descriptor.template) {
        case "bare-bones":
          return {
            codeText: "import pytch\n",
            assets: ["python-logo.png"],
          };
        case "with-sample-code":
          return {
            codeText: templateCodeWithSampleCode,
            assets: ["green-burst.jpg", "python-logo.png"],
          };
        default:
          return assertNever(descriptor.template);
      }
    })();

    const program = PytchProgramOps.fromPythonCode(templateContent.codeText);
    const newProject = await createNewProject(descriptor.name, { program });

    // These are fetched at runtime:
    const skeletonAssetFilenames = templateContent.assets;
    await Promise.all(
      skeletonAssetFilenames.map((basename) =>
        addRemoteAssetToProject(
          newProject.id,
          urlWithinApp(`/assets/${basename}`)
        )
      )
    );

    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);
    return newProject;
  }),

  requestCopyProjectThenResync: thunk(async (actions, saveAsDescriptor) => {
    const newId = await copyProject(
      saveAsDescriptor.sourceProjectId,
      saveAsDescriptor.nameOfCopy
    );

    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);

    return newId;
  }),

  requestDeleteManyProjectsThenResync: thunk(async (actions, projectIds) => {
    await deleteManyProjects(projectIds);
    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);
  }),

  requestRenameProjectThenResync: thunk(async (actions, args) => {
    await renameProject(args.id, args.name);
    // TODO: Do something with return value?
    //
    // Can be zero if the given ID was not found, or if we tried to
    // "rename" the project to its current name.

    const summaries = await allProjectSummaries();
    actions.setAvailable(summaries);
  }),

  availableSelectedIds: computed((state) =>
    state.available
      .filter((project) => project.isSelected)
      .map((project) => project.summary.id)
  ),

  toggleProjectSelected: action((state, projectId) => {
    const index = state.available.findIndex(
      (project) => project.summary.id === projectId
    );
    if (index === -1) {
      console.error(`could not find project with id ${projectId}`);
      return;
    }
    state.available[index].isSelected = !state.available[index].isSelected;
  }),

  clearAllSelected: action((state) => {
    state.available.forEach((project) => {
      project.isSelected = false;
    });
  }),

  updateTutorialChapter: action((state, trackingUpdate) => {
    const targetProjectId = trackingUpdate.projectId;
    const project = failIfNull(
      state.available.find((p) => p.summary.id === targetProjectId),
      `could not find project ${targetProjectId} to update`
    );
    const trackedTutorial = failIfNull(
      project.summary.trackedTutorial,
      `project ${targetProjectId} is not tracking a tutorial`
    );

    trackedTutorial.activeChapterIndex = trackingUpdate.chapterIndex;
  }),
};
