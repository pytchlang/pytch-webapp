import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { SyncState } from "./project";
import {
  allTutorialSummaries,
  tutorialAssetURLs,
  tutorialContent,
} from "../database/tutorials";
import {
  createNewProject,
  addRemoteAssetToProject,
  CreateProjectOptions,
} from "../database/indexed-db";
import { IPytchAppModel, PytchAppModelActions } from ".";
import { batch } from "react-redux";
import { PytchProgramOps } from "./pytch-program";

export type SingleTutorialDisplayKind =
  | "tutorial-only"
  | "tutorial-and-demo"
  | "tutorial-demo-and-share";

export interface ITutorialSummary {
  slug: string;
  contentNodes: Array<Node>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

export interface ITutorialCollection {
  syncState: SyncState;
  available: Array<ITutorialSummary>;
  maybeSlugCreating: string | undefined;

  setSyncState: Action<ITutorialCollection, SyncState>;
  setAvailable: Action<ITutorialCollection, Array<ITutorialSummary>>;
  setSlugCreating: Action<ITutorialCollection, string>;
  clearSlugCreating: Action<ITutorialCollection>;
  loadSummaries: Thunk<ITutorialCollection>;

  createProjectFromTutorial: Thunk<
    ITutorialCollection,
    string,
    void,
    IPytchAppModel
  >;
  createDemoFromTutorial: Thunk<
    ITutorialCollection,
    string,
    void,
    IPytchAppModel
  >;
}

type ProjectCreationArgs = {
  name: string;
  options: CreateProjectOptions;
};

type ProjectCreationArgsFun = (
  tutorialSlug: string
) => Promise<ProjectCreationArgs>;

const createProjectFromTutorial = async (
  actions: Actions<ITutorialCollection>,
  tutorialSlug: string,
  helpers: {
    // Don't think easy-peasy defines a named type for "helpers".
    getStoreActions: () => PytchAppModelActions;
  },
  methods: {
    projectCreationArgs: ProjectCreationArgsFun;
    completionAction: () => void;
  }
) => {
  const storeActions = helpers.getStoreActions();
  const addProject = storeActions.projectCollection.addProject;

  // TODO: This is annoying because we're going to request the tutorial content
  // twice.  Once now, and once when we navigate to the IDE and it notices the
  // project is tracking a tutorial.  Change the IDE logic to more 'ensure we
  // have tutorial' rather than 'fetch tutorial'?

  actions.setSlugCreating(tutorialSlug);

  const createProjectArgs = await methods.projectCreationArgs(tutorialSlug);
  const project = await createNewProject(
    createProjectArgs.name,
    createProjectArgs.options
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

  addProject(project);

  batch(() => {
    actions.clearSlugCreating();
    methods.completionAction();
    storeActions.navigationRequestQueue.enqueue({ path: `/ide/${project.id}` });
  });
};

export const tutorialCollection: ITutorialCollection = {
  syncState: SyncState.SyncNotStarted,
  available: [],
  maybeSlugCreating: undefined,

  setSyncState: action((state, syncState) => {
    state.syncState = syncState;
  }),

  setAvailable: action((state, summaries) => {
    state.available = summaries;
  }),

  setSlugCreating: action((state, slug) => {
    state.maybeSlugCreating = slug;
  }),
  clearSlugCreating: action((state) => {
    state.maybeSlugCreating = undefined;
  }),

  loadSummaries: thunk(async (actions) => {
    actions.setSyncState(SyncState.SyncingFromBackEnd);
    const summaries = await allTutorialSummaries();
    batch(() => {
      actions.setAvailable(summaries);
      actions.setSyncState(SyncState.Syncd);
    });
  }),

  createProjectFromTutorial: thunk(async (actions, tutorialSlug, helpers) => {
    await createProjectFromTutorial(actions, tutorialSlug, helpers, {
      projectCreationArgs: async (tutorialSlug: string) => {
        const content = await tutorialContent(tutorialSlug);
        const program = PytchProgramOps.fromPythonCode(content.initialCode);
        return [
          `My "${tutorialSlug}"`,
          `This project is following the tutorial "${tutorialSlug}"`,
          { slug: tutorialSlug, activeChapterIndex: 0 },
          program,
        ];
      },
      completionAction: () => {
        helpers.getStoreActions().ideLayout.dismissButtonTour();
      },
    });
  }),

  createDemoFromTutorial: thunk(async (actions, tutorialSlug, helpers) => {
    await createProjectFromTutorial(actions, tutorialSlug, helpers, {
      projectCreationArgs: async (tutorialSlug: string) => {
        const content = await tutorialContent(tutorialSlug);
        const program = PytchProgramOps.fromPythonCode(content.completeCode);
        return [
          `Demo of "${tutorialSlug}"`,
          `This project is a demo of the tutorial "${tutorialSlug}"`,
          undefined, // no tracked-tutorial
          program,
        ];
      },
      completionAction: () => {
        helpers.getStoreActions().ideLayout.initiateButtonTour();
      },
    });
  }),
};
