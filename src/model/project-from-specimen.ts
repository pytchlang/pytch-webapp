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

  fail: Action<ProjectFromSpecimenFlow, string>;
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
      const nExisting = existingProjects.length;

      // The following case analysis is to try to be helpful to the user.

      switch (nExisting) {
        case 0: {
          // No user projects linked to this specimen.

          // Create one with no further user interaction.
          await actions.createFromSpecimen(lesson);
          break;
        }
        case 1: {
          // Exactly one existing project linked to this specimen.

          // If it is identical in content to the specimen, open it with
          // no further user interaction.
          const soleExistingProject = existingProjects[0];
          const soleExistingProjectId = soleExistingProject.id;
          const projectHash = await projectContentHash(soleExistingProjectId);
          if (projectHash === lesson.specimenContentHash) {
            actions.redirectToProject(soleExistingProjectId);
            break;
          }

          // Otherwise, offer options: to genuinely create new project;
          // to open the sole existing project.
          actions.setState({
            state: "awaiting-user-choice",
            projectName: lesson.project.name,
            startAfreshOption: { kind: "create", lesson },
            existingProjectOptions: [soleExistingProject],
          });
          break;
        }
        default: {
          // Augment the array of existing projects with a flag saying
          // whether each is identical to the specimen.
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

          const changedProjectSummaries = augExistingProjects
            .filter((augProject) => !augProject.isIdenticalToSpecimen)
            .map((augProject) => augProject.projectSummary);

          // If no existing project is identical to the specimen, offer
          // options: to genuinely create new project; to open an
          // existing project.
          if (existingIdentical.length === 0) {
            actions.setState({
              state: "awaiting-user-choice",
              projectName: lesson.project.name,
              startAfreshOption: { kind: "create", lesson },
              existingProjectOptions: changedProjectSummaries,
            });
            break;
          }

          // Otherwise (i.e., at least one existing project is identical
          // to the specimen), offer options: to open the most recent
          // identical project (which will be presented as a pseudo
          // "start afresh with this lesson" option); to open an
          // existing non-identical project.

          // The most recently-modified unchanged project will be first,
          // since the DB sorts descending by mtime.
          const projectId = existingIdentical[0].projectSummary.id;

          actions.setState({
            state: "awaiting-user-choice",
            projectName: lesson.project.name,
            startAfreshOption: { kind: "open-existing-identical", projectId },
            existingProjectOptions: changedProjectSummaries,
          });
          break;
        }
      }
    } catch (e) {
      console.error("projectFromSpecimenFlow.boot():", e);
      actions.fail("Sorry, something went wrong fetching the lesson.");
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
