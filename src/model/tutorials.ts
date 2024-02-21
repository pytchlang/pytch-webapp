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
  AddAssetDescriptor,
} from "../database/indexed-db";
import { IPytchAppModel, PytchAppModelActions } from ".";
import { PytchProgramOps } from "./pytch-program";
import {
  assertNever,
  fetchArrayBuffer,
  fetchMimeTypedArrayBuffer,
} from "../utils";
import { urlWithinApp } from "../env-utils";
import { tutorialResourceParsedJson, tutorialUrl } from "./tutorial";
import {
  Uuid,
  IEmbodyContext,
  StructuredProgramOps,
} from "./junior/structured-program";

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

  // This is clunky.  For "flat" tutorials, we can load the assets here,
  // but for "per-method" tutorials, the caller provides the actual
  // assets in `options.assets`.  See the `createProjectFromTutorial()`
  // thunk below.
  const isPerMethod = createProjectArgs.options.program?.kind === "per-method";
  const assetURLs = isPerMethod ? [] : await tutorialAssetURLs(tutorialSlug);

  // It's enough to make the back-end database know about the assets
  // belonging to the newly-created project, because when we navigate
  // to the new project the front-end will fetch that information
  // afresh.  TODO: Some kind of cache layer so we don't push then
  // fetch the exact same information.
  await Promise.all(
    assetURLs.map((url) => addRemoteAssetToProject(project.id, url))
  );

  actions.clearSlugCreating();
  methods.completionAction();
  storeActions.projectCollection.noteDatabaseChange();
  storeActions.navigationRequestQueue.enqueue({ path: `/ide/${project.id}` });
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
    actions.setAvailable(summaries);
    actions.setSyncState(SyncState.Syncd);
  }),

  createProjectFromTutorial: thunk(async (actions, tutorialSlug, helpers) => {
    await createProjectFromTutorial(actions, tutorialSlug, helpers, {
      projectCreationArgs: async (tutorialSlug: string) => {
        const content = await tutorialContent(tutorialSlug);

        // TODO: Can this be tidied up?
        //
        // TODO: Currently a "flat"-program tutorial is stored as a
        // "tracked tutorial", whereas a "per-method"-program tutorial
        // is stored as "linked content".  Change the storage of
        // "flat"-program tutorials to also use the "linked content"
        // mechanism.
        const options: CreateProjectOptions = await (async () => {
          switch (content.programKind) {
            case "flat":
              return {
                summary: `This project is following the tutorial "${tutorialSlug}"`,
                trackedTutorialRef: {
                  slug: tutorialSlug,
                  activeChapterIndex: 0,
                },
                program: PytchProgramOps.fromPythonCode(content.initialCode),
              };
            case "per-method": {
              const program = PytchProgramOps.newEmpty("per-method");

              // This is clunky; see also other comment above, in the
              // function `createProjectFromTutorial()`.
              //
              // We currently assume that all "per-method" tutorials
              // should start empty except for a stage with a
              // solid-white background.  One day this might not always
              // be true.
              const stageId = program.program.actors[0].id;
              const stageImageUrl = urlWithinApp("/assets/solid-white.png");
              const data = await fetchArrayBuffer(stageImageUrl);
              const assets: Array<AddAssetDescriptor> = [
                {
                  name: `${stageId}/solid-white.png`,
                  mimeType: "image/png",
                  data,
                },
              ];

              return {
                summary: `This project is following the tutorial "${tutorialSlug}"`,
                linkedContentRef: {
                  kind: "jr-tutorial" as const,
                  name: tutorialSlug,
                  interactionState: { chapterIndex: 0, nTasksDone: 0 },
                },
                program,
                assets,
              };
            }
            default:
              return assertNever(content.programKind);
          }
        })();

        return {
          name: `My "${tutorialSlug}"`,
          options,
        };
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
        const summary = `This project is a demo of the tutorial "${tutorialSlug}"`;
        const options: CreateProjectOptions = await (async () => {
          switch (content.programKind) {
            case "flat": {
              const program = PytchProgramOps.fromPythonCode(
                content.completeCode
              );
              return { summary, program };
            }
            case "per-method": {
              const skeletonUrl = `${tutorialSlug}/skeleton-structured-program.json`;
              const skeleton = await tutorialResourceParsedJson(skeletonUrl);
              const embodyContext = new EmbodyDemoFromTutorial(tutorialSlug);
              const structuredProgram = StructuredProgramOps.fromSkeleton(
                skeleton,
                embodyContext
              );
              const program =
                PytchProgramOps.fromStructuredProgram(structuredProgram);
              const assets = await embodyContext.allAddAssetDescriptors();
              return { summary, program, assets };
            }
            default:
              return assertNever(content.programKind);
          }
        })();

        return {
          name: `Demo of "${tutorialSlug}"`,
          options,
        };
      },
      completionAction: () => {
        helpers.getStoreActions().ideLayout.initiateButtonTour();
      },
    });
  }),
};

class EmbodyDemoFromTutorial implements IEmbodyContext {
  assets: Array<{ actorId: Uuid; assetBasename: string }> = [];
  assetPath: string;

  constructor(tutorialSlug: string) {
    this.assetPath = `${tutorialSlug}/project-assets`;
  }

  registerActorAsset(actorId: Uuid, assetBasename: string): void {
    this.assets.push({ actorId, assetBasename });
  }

  allAddAssetDescriptors(): Promise<Array<AddAssetDescriptor>> {
    return Promise.all(
      this.assets.map(async (asset): Promise<AddAssetDescriptor> => {
        const name = `${asset.actorId}/${asset.assetBasename}`;
        const url = tutorialUrl(`${this.assetPath}/${asset.assetBasename}`);
        const { mimeType, data } = await fetchMimeTypedArrayBuffer(url);
        return { name, mimeType, data };
      })
    );
  }
}
