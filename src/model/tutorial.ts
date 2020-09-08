import { SyncState } from "./project";
import { Action, action, Thunk, thunk } from "easy-peasy";
import { tutorialContent } from "../database/tutorials";

export interface ITutorialChapter {
  title: string;
  maybeNextTitle: string | null;
  maybePrevTitle: string | null;
  contentElements: Array<HTMLElement>;
}

export type TutorialId = string; // The slug.  TODO: Replace with more proper id?

export interface ITutorialContent {
  slug: TutorialId;
  initialCode: string;
  completeCode: string;
  chapters: Array<ITutorialChapter>;
  activeChapterIndex: number;
}

type IMaybeTutorial = ITutorialContent | null;

export interface IActiveTutorial {
  syncState: SyncState;
  tutorial: IMaybeTutorial;

  setSyncState: Action<IActiveTutorial, SyncState>;
  setContent: Action<IActiveTutorial, ITutorialContent>;
  clear: Action<IActiveTutorial>;

  navigateToChapter: Action<IActiveTutorial, number>;

  requestSyncFromStorage: Thunk<IActiveTutorial, TutorialId>;
}

export const activeTutorial: IActiveTutorial = {
  syncState: SyncState.SyncNotStarted,
  tutorial: null,

  setSyncState: action((state, syncState) => {
    state.syncState = syncState;
  }),

  setContent: action((state, content) => {
    state.tutorial = content;
  }),

  clear: action((state) => {
    state.syncState = SyncState.SyncNotStarted;
    state.tutorial = null;
  }),

  navigateToChapter: action((state, chapterIndex) => {
    if (state.tutorial == null)
      throw Error("cannot navigate to chapter if no tutorial");
    state.tutorial.activeChapterIndex = chapterIndex;
  }),

  requestSyncFromStorage: thunk(async (actions, slug) => {
    actions.setSyncState(SyncState.SyncingFromBackEnd);
    const content = await tutorialContent(slug);
    actions.setContent(content);
    actions.setSyncState(SyncState.Syncd);
  }),
};
