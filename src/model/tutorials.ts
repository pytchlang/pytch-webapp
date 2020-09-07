import { Action, action, Thunk, thunk } from "easy-peasy";
import { SyncState } from "./project";
import {
  allTutorialSummaries,
  tutorialAssetURLs,
  tutorialContent,
} from "../database/tutorials";
import {
  createNewProject,
  addRemoteAssetToProject,
} from "../database/indexed-db";
import { IPytchAppModel } from ".";
import { navigate } from "@reach/router";
import { ITrackedTutorial } from "./projects";

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

    // TODO: This is annoying because we're going to request the tutorial content
    // twice.  Once now, and once when we navigate to the IDE and it notices the
    // project is tracking a tutorial.  Change the IDE logic to more 'ensure we
    // have tutorial' rather than 'fetch tutorial'?

    const content = await tutorialContent(tutorialSlug);

    const name = `My "${tutorialSlug}"`;
    const summary = `This project is following the tutorial "${tutorialSlug}"`;
    const tracking: ITrackedTutorial = { slug: tutorialSlug, chapterIndex: 0 };
    const project = await createNewProject(
      name,
      summary,
      tracking,
      content.initialCode
    );
    const assetURLs = await tutorialAssetURLs(tutorialSlug);

    // It's enough to make the back-end database know about the assets
    // belonging to the newly-created project, because when we navigate
    // to the new project the front-end will fetch that information
    // afresh.  TODO: Some kind of cache layer so we don't push then
    // fetch the exact same information.
    await Promise.all(
      assetURLs.map((url) => addRemoteAssetToProject(project.id, url))
    );

    console.log(
      "ITutorialCollection.createProjectFromTutorial(): about to add",
      project
    );
    addProject(project);
    console.log(
      "ITutorialCollection.createProjectFromTutorial(): added",
      project
    );

    await navigate(`/ide/${project.id}`);
  }),
};
