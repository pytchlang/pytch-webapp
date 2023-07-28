import { ProjectId } from "./project-core";
import {
  LessonDescriptor,
} from "./linked-content";

export type StartAfreshOption =
  | { kind: "create"; lesson: LessonDescriptor }
  | { kind: "open-existing-identical"; projectId: ProjectId };
