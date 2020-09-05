import { SyncState } from "./project";
import { Action, action, Thunk, thunk } from "easy-peasy";
import { tutorialContent } from "../database/tutorials";

export interface ITutorialChapter {
  title: string;
  maybeNextTitle: string | null;
  maybePrevTitle: string | null;
  contentNodes: Array<HTMLElement>;
}

export type TutorialId = string; // The slug.  TODO: Replace with more proper id?

export interface ITutorialContent {
  slug: TutorialId;
  chapters: Array<ITutorialChapter>;
  activeChapterIndex: number;
}

type IMaybeTutorial = ITutorialContent | null;

export interface IActiveTutorial {
  syncState: SyncState;
  tutorial: IMaybeTutorial;

  setSyncState: Action<IActiveTutorial, SyncState>;
  setContent: Action<IActiveTutorial, ITutorialContent>;

  requestSyncFromStorage: Thunk<IActiveTutorial, TutorialId>;
}

export const activeTutorial: IActiveTutorial = {
  syncState: SyncState.NoProject,
  tutorial: null,

  setSyncState: action((state, syncState) => {
    state.syncState = syncState;
  }),

  setContent: action((state, content) => {
    state.tutorial = content;
  }),

  requestSyncFromStorage: thunk(async (actions, slug) => {
    actions.setSyncState(SyncState.SyncingFromStorage);
    const content = await tutorialContent(slug);
    actions.setContent(content);
    actions.setSyncState(SyncState.Syncd);
  }),
};
