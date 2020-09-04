import { Action, action, Thunk, thunk } from "easy-peasy";
import { SyncState } from "./project";
import { allTutorialSummaries } from "../database/tutorials";

export interface ITutorialSummary {
    slug: string;
    contentNodes: Array<Node>;
}

export interface ITutorialCollection {
    syncState: SyncState;
    available: Array<ITutorialSummary>;

    setSyncState: Action<ITutorialCollection, SyncState>;
    setAvailable: Action<ITutorialCollection, Array<ITutorialSummary>>;
    loadSummaries: Thunk<ITutorialCollection>;
}

export const tutorialCollection: ITutorialCollection = {
    syncState: SyncState.NoProject,  // TODO: Rename to 'SyncNotStarted'?
    available: [],

    setSyncState: action((state, syncState) => {
        state.syncState = syncState;
    }),

    setAvailable: action((state, summaries) => {
        state.available = summaries;
    }),

    loadSummaries: thunk(async (actions) => {
        actions.setSyncState(SyncState.SyncingFromStorage);
        const summaries = await allTutorialSummaries();
        actions.setAvailable(summaries);
        actions.setSyncState(SyncState.Syncd);
    }),
};
