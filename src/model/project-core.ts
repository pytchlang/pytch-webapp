import { ITutorialContent } from "./tutorial";

export type ProjectId = number;

export interface ITrackedTutorial {
  content: ITutorialContent;
  activeChapterIndex: number;
}
