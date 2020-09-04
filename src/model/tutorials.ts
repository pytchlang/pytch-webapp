import { Action, action, Thunk, thunk } from "easy-peasy";
import { SyncState } from "./project";

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
