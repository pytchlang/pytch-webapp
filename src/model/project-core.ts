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
  trackedTutorial?: ITrackedTutorial;
};
