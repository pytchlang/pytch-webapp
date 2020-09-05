import { Action, action, Thunk, thunk } from "easy-peasy";
import { SyncState } from "./project";
import { allTutorialSummaries } from "../database/tutorials";
import { createNewProject } from "../database/indexed-db";
import { IPytchAppModel } from ".";
import { navigate } from "@reach/router";

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

  createProjectFromTutorial: Thunk<
    ITutorialCollection,
    string,
    {},
    IPytchAppModel
  >;
}

export const tutorialCollection: ITutorialCollection = {
  syncState: SyncState.NoProject, // TODO: Rename to 'SyncNotStarted'? 'NoSyncStarted'? 'BeforeFirstSync'?
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

  createProjectFromTutorial: thunk(async (actions, tutorialSlug, helpers) => {
    const storeActions = helpers.getStoreActions();
    const addProject = storeActions.projectCollection.addProject;
    const requestTutorialSync =
      storeActions.activeTutorial.requestSyncFromStorage;

    const name = `My "${tutorialSlug}"`;
    const summary = `This project is following the tutorial "${tutorialSlug}"`;
    const project = await createNewProject(name, summary);

    console.log(
      "ITutorialCollection.createProjectFromTutorial(): about to add",
      project
    );
    addProject(project);
    console.log(
      "ITutorialCollection.createProjectFromTutorial(): added",
      project
    );

    await Promise.all([
      navigate(`/ide/${project.id}`),
      requestTutorialSync(tutorialSlug),
    ]);
  }),
};
