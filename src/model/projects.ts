import { Action, action, computed, Computed, Thunk, thunk } from "easy-peasy";
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
import {
  ProjectId,
  ITrackedTutorial,
  RemoteAssetProjectDescriptor,
} from "./project-core";
import { PytchProgramKind, PytchProgramOps } from "./pytch-program";
import { LinkedContentRef } from "./linked-content-core";
import { StructuredProgramOps } from "./junior/structured-program";
import { ProjectTemplateKind } from "./project-templates";

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
// TODO: Combine trackedTutorial with linkedContentRef?  Similar ideas,
// in that they tell us where this project came from. "Origin"?
// "Provenance"? "Antecedent"? "Upstream"?  That would also help us find
// projects which are connected to the requested lesson or task --- look
// only at projects with upstream.kind === "lesson-task". Could make
// upstream be required, being eg { kind: "template", template:
// "bare-bones" } if the user just does "create-project". What about
// when the user copies one of their projects?  Import?
export interface IProjectSummary {
  id: ProjectId;
  name: string;
  programKind: PytchProgramKind;
  mtime: number;
  linkedContentRef: LinkedContentRef;
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

  doLoadingWork: Thunk<IProjectCollection>;

  setAvailable: Action<IProjectCollection, Array<IProjectSummary>>;
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
    Array<ProjectId>,
    void,
    IPytchAppModel,
    Promise<void>
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

  doLoadingWork: thunk(async (actions, _voidPayload, helpers) => {
    const state = helpers.getState().loadingStatus;
    const requiredSeqnum = helpers.getState().loadSeqnumNeeded;

    if (state.seqnum < requiredSeqnum) {
      const workingSeqnum = requiredSeqnum;
      actions.setLoadingStatus({ kind: "pending", seqnum: workingSeqnum });
      try {
        const summaries = await allProjectSummaries();

        const liveRequiredSeqnum = helpers.getState().loadSeqnumNeeded;
        if (liveRequiredSeqnum === workingSeqnum) {
          actions.setLoadingStatus({
            kind: "succeeded",
            seqnum: workingSeqnum,
          });
          actions.setAvailable(summaries);
        }
      } catch (e) {
        console.error("doLoadingWork()", e);
        actions.setLoadingStatus({ kind: "failed", seqnum: workingSeqnum });
      }
    }
  }),

  setAvailable: action((state, summaries) => {
    state.available = summaries.map((summary) => ({
      summary,
      isSelected: false,
    }));
  }),

  createNewProject: thunk(async (actions, descriptor) => {
    const templateContent: RemoteAssetProjectDescriptor = (() => {
      switch (descriptor.template) {
        case "bare-bones":
          return {
            program: PytchProgramOps.fromPythonCode("import pytch\n"),
            assets: [{ urlBasename: "python-logo.png" }],
          };
        case "with-sample-code":
          return {
            program: PytchProgramOps.fromPythonCode(templateCodeWithSampleCode),
            assets: [
              { urlBasename: "green-burst.jpg" },
              { urlBasename: "python-logo.png" },
            ],
          };
        case "bare-per-method": {
          const structuredProgram = StructuredProgramOps.newEmpty();
          const stageId = structuredProgram.actors[0].id;
          const customLocalName = `${stageId}/solid-white.png`;
          return {
            program: PytchProgramOps.fromStructuredProgram(structuredProgram),
            assets: [{ urlBasename: "solid-white.png", customLocalName }],
          };
        }
        case "simple-example-per-method": {
          const structuredProgram = StructuredProgramOps.newSimpleExample();
          const stageId = structuredProgram.actors[0].id;
          const spriteId = structuredProgram.actors[1].id;
          const backgroundName = `${stageId}/solid-white.png`;
          const costumeName = `${spriteId}/python-logo.png`;
          return {
            program: PytchProgramOps.fromStructuredProgram(structuredProgram),
            assets: [
              {
                urlBasename: "solid-white.png",
                customLocalName: backgroundName,
              },
              {
                urlBasename: "python-logo.png",
                customLocalName: costumeName,
              },
            ],
          };
        }
        default:
          return assertNever(descriptor.template);
      }
    })();

    const program = templateContent.program;
    const newProject = await createNewProject(descriptor.name, { program });

    const remoteAssets = templateContent.assets;
    await Promise.all(
      remoteAssets.map(({ urlBasename, customLocalName }) =>
        addRemoteAssetToProject(
          newProject.id,
          urlWithinApp(`/assets/${urlBasename}`),
          customLocalName
        )
      )
    );

    actions.noteDatabaseChange();

    return newProject;
  }),

  requestCopyProjectThenResync: thunk(async (actions, saveAsDescriptor) => {
    const newId = await copyProject(
      saveAsDescriptor.sourceProjectId,
      saveAsDescriptor.nameOfCopy
    );

    actions.noteDatabaseChange();

    return newId;
  }),

  requestDeleteManyProjectsThenResync: thunk(async (actions, projectIds) => {
    await deleteManyProjects(projectIds);
    actions.noteDatabaseChange();
  }),

  requestRenameProjectThenResync: thunk(async (actions, args) => {
    await renameProject(args.id, args.name);
    // TODO: Do something with return value?
    //
    // Can be zero if the given ID was not found, or if we tried to
    // "rename" the project to its current name.

    actions.noteDatabaseChange();
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
    // TODO: Think this is broken?

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
