import { Action, action, Thunk, thunk } from "easy-peasy";
import { assertNever, propSetterAction } from "../utils";
import {
  createNewProject,
  CreateProjectOptions,
} from "../database/indexed-db";
import { IProjectSummary } from "./projects";
import { IPytchAppModel } from ".";
import { ProjectId } from "./project-core";
import {
  LessonDescriptor,
} from "./linked-content";

export type StartAfreshOption =
  | { kind: "create"; lesson: LessonDescriptor }
  | { kind: "open-existing-identical"; projectId: ProjectId };

type ProjectFromSpecimenState =
  | { state: "not-yet-booted" }
  | { state: "fetching" }
  | {
      state: "awaiting-user-choice";
      projectName: string;
      startAfreshOption: StartAfreshOption;
      existingProjectOptions: Array<IProjectSummary>;
    }
  | { state: "creating-new" }
  | { state: "redirecting" }
  | { state: "failed"; message: string };

export type ProjectFromSpecimenFlow = {
  state: ProjectFromSpecimenState;
  setState: Action<ProjectFromSpecimenFlow, ProjectFromSpecimenState>;

  createFromSpecimen: Thunk<
    ProjectFromSpecimenFlow,
    LessonDescriptor,
    void,
    IPytchAppModel,
    Promise<void>
  >;
  redirectToProject: Thunk<
    ProjectFromSpecimenFlow,
    ProjectId,
    void,
    IPytchAppModel,
    void
  >;

  fail: Action<ProjectFromSpecimenFlow, string>;
};

export let projectFromSpecimenFlow: ProjectFromSpecimenFlow = {
  state: { state: "not-yet-booted" },
  setState: propSetterAction("state"),

  createFromSpecimen: thunk(async (actions, lesson, helpers) => {
    const allActions = helpers.getStoreActions();

    const creationOptions: CreateProjectOptions = {
      summary: lesson.project.summary,
      program: lesson.project.program,
      assets: lesson.project.assets,
      linkedContentRef: {
        kind: "specimen",
        specimenContentHash: lesson.specimenContentHash,
      },
    };

    actions.setState({ state: "creating-new" });

    const project = await createNewProject(
      lesson.project.name,
      creationOptions
    );
    allActions.projectCollection.noteDatabaseChange();

    actions.redirectToProject(project.id);
  }),

  redirectToProject: thunk((actions, projectId, helpers) => {
    const allActions = helpers.getStoreActions();
    actions.setState({ state: "redirecting" });

    allActions.navigationRequestQueue.enqueue({
      path: `/ide/${projectId}`,
      opts: { replace: true },
    });
  }),

  fail: action((state, message) => {
    state.state = { state: "failed", message };
  }),
};
