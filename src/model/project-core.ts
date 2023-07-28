import { LinkedContentRef } from "./linked-content";
import { PytchProgram } from "./pytch-program";
import { ITutorialContent } from "./tutorial";

export type ProjectId = number;

// TODO: Move this to linked-content if it turns out to be a good idea
// to unify linked-content with tutorials.
export interface ITrackedTutorial {
  content: ITutorialContent;
  activeChapterIndex: number;
}

export type StoredProjectData<AssetT> = {
  id: ProjectId;
  name: string;
  program: PytchProgram;
  assets: Array<AssetT>;
  linkedContentRef: LinkedContentRef;
  trackedTutorial?: ITrackedTutorial;
};
