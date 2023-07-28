import { LinkedContentRef } from "./linked-content";
import { PytchProgram } from "./pytch-program";
import { ITutorialContent } from "./tutorial";

export type ProjectId = number;

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
