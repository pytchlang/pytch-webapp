import { Action, action, Thunk, thunk } from "easy-peasy";
import { assertNever, propSetterAction } from "../utils";
import {
  createNewProject,
  CreateProjectOptions,
  projectContentHash,
  projectSummariesWithLink,
} from "../database/indexed-db";
import { IProjectSummary } from "./projects";
import { IPytchAppModel } from ".";
import { ProjectId } from "./project-core";
import {
  LessonDescriptor,
  lessonDescriptorFromRelativePath,
} from "./linked-content";
import { projectSummary } from "../storage/zipfile";
import { LinkedContentRef } from "./linked-content-core";

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
  | { state: "failed" };

export type ProjectFromSpecimenFlow = {
  state: ProjectFromSpecimenState;
  setState: Action<ProjectFromSpecimenFlow, ProjectFromSpecimenState>;

  boot: Thunk<ProjectFromSpecimenFlow, string, void, IPytchAppModel>;
  enactStartAfreshChoice: Thunk<ProjectFromSpecimenFlow, StartAfreshOption>;
  enactExistingProjectChoice: Thunk<ProjectFromSpecimenFlow, IProjectSummary>;

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

  fail: Action<ProjectFromSpecimenFlow>;
};

export let projectFromSpecimenFlow: ProjectFromSpecimenFlow = {
  state: { state: "not-yet-booted" },
  setState: propSetterAction("state"),

  boot: thunk(async (actions, relativePath, helpers) => {
    if (helpers.getState().state.state !== "not-yet-booted") {
      return;
    }

    actions.setState({ state: "fetching" });

    try {
      const lesson = await lessonDescriptorFromRelativePath(relativePath);

      let existingProjects = await projectSummariesWithLink({
        kind: "specimen",
        specimenContentHash: lesson.specimenContentHash,
      });

      const augExistingProjects = await Promise.all(
        existingProjects.map(async (projectSummary) => ({
          projectSummary,
          isIdenticalToSpecimen:
            (await projectContentHash(projectSummary.id)) ===
            lesson.specimenContentHash,
        }))
      );

      const existingIdentical = augExistingProjects.filter(
        (p) => p.isIdenticalToSpecimen
      );
      const nExistingIdentical = existingIdentical.length;

      const existingChanged = augExistingProjects.filter(
        (p) => !p.isIdenticalToSpecimen
      );
      const nExistingChanged = existingChanged.length;

      // The following case analysis is to try to be helpful to the user.

      if (nExistingChanged === 0) {
        // The user does not have any projects which are linked to this specimen
        // and which are not identical to the specimen.  Go directly to a
        // project identical to the specimen.
        if (nExistingIdentical === 0) {
          await actions.createFromSpecimen(lesson);
          return;
        } else {
          const mostRecentExistingId = existingIdentical[0].projectSummary.id;
          actions.redirectToProject(mostRecentExistingId);
          return;
        }
      } else {
        // User has at least one project linked to this specimen and changed
        // from the specimen.  Offer a choice between starting afresh and
        // opening an existing changed project.

        // "Starting afresh" can mean creating a new project or opening
        // an existing identical one.
        const startAfreshOption: StartAfreshOption =
          nExistingIdentical === 0
            ? { kind: "create", lesson }
            : {
                kind: "open-existing-identical",
                projectId: existingIdentical[0].projectSummary.id,
              };

        const existingProjectOptions = existingChanged.map(
          (p) => p.projectSummary
        );

        actions.setState({
          state: "awaiting-user-choice",
          projectName: lesson.project.name,
          startAfreshOption,
          existingProjectOptions,
        });

        return;
      }
    } catch (e) {
      console.error("projectFromSpecimenFlow.boot():", e);
      actions.fail();
    }
  }),

  enactStartAfreshChoice: thunk(async (actions, choice) => {
    switch (choice.kind) {
      case "create":
        await actions.createFromSpecimen(choice.lesson);
        break;
      case "open-existing-identical":
        actions.redirectToProject(choice.projectId);
        break;
      default:
        assertNever(choice);
    }
  }),

  enactExistingProjectChoice: thunk((actions, projectSummary) => {
    actions.redirectToProject(projectSummary.id);
  }),

  createFromSpecimen: thunk(async (actions, lesson, helpers) => {
    const allActions = helpers.getStoreActions();

    const linkedContentRef: LinkedContentRef = {
      kind: "specimen",
      specimenContentHash: lesson.specimenContentHash,
    };

    console.log("creating project with creation options", creationOptions);

    const creationOptions: CreateProjectOptions = {
      summary: projectSummary(undefined, linkedContentRef),
      program: lesson.project.program,
      assets: lesson.project.assets,
      cloudProjectId: -1,
      linkedContentRef,
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

  fail: action((state) => {
    state.state = { state: "failed" };
  }),
};
