import { ITutorialContent } from "./tutorial";

export type ProjectId = number;

export interface ITrackedTutorial {
  content: ITutorialContent;
  activeChapterIndex: number;
}

export type StoredProjectData<AssetT> = {
  id: ProjectId;
  name: string;
  codeText: string;
  assets: Array<AssetT>;
  trackedTutorial?: ITrackedTutorial;
};
