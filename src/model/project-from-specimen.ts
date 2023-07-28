import { Action, action, Thunk, thunk } from "easy-peasy";
import { assertNever, propSetterAction } from "../utils";
import { IProjectSummary } from "./projects";
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
};

export let projectFromSpecimenFlow: ProjectFromSpecimenFlow = {
  state: { state: "not-yet-booted" },
  setState: propSetterAction("state"),
};
