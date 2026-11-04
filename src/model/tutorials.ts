import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import i18next from "i18next";
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
  fetchMimeTypedArrayBuffer,
  propSetterAction,
} from "../utils";
import { tutorialResourceParsedJson, tutorialUrl } from "./tutorial";
import {
  Uuid,
  IEmbodyContext,
  StructuredProgramOps,
} from "./junior/structured-program";
import { NavigateOptions } from "react-router-dom";
import { JrTutorialCheckpointSkeleton } from "./junior/jr-tutorial";
import { kLinkedContentRefNone, LinkedContentRef } from "./linked-content-core";
import { TutorialSlugAndMetadata } from "./tutorial-metadata";
import { withUniqueTutorialLanguages } from "./tutorial-languages";
import { ResourceLanguageSelector } from "./resource-language";

const kAllowRandomChapterAccessSearchParam =
  "allowRandomChapterAccessInTutorials";

export type SingleTutorialDisplayKind =
  | "tutorial-only"
  | "tutorial-and-demo"
  | "tutorial-demo-and-share";

export interface ITutorialSummary extends TutorialSlugAndMetadata {
  contentNodes: Array<Node>;
}

export type CreateProjectFromTutorialArgs = {
  slug: string;
  chapterIndex: number;
  navigateWithReplace?: boolean;
};

type SAction<PayloadT = void> = Action<ITutorialCollection, PayloadT>;
type SThunk<PayloadT = void, ReturnT = void> = Thunk<
  ITutorialCollection,
  PayloadT,
  unknown,
  IPytchAppModel,
  ReturnT
>;
type ASThunk<PayloadT = void, ReturnT = void> = SThunk<
  PayloadT,
  Promise<ReturnT>
>;

export interface ITutorialCollection {
  syncState: SyncState;
  available: Array<ITutorialSummary>;
  maybeSlugCreating: string | undefined;
  allowRandomChapterAccess: boolean;
  languageSelector: ResourceLanguageSelector;

  setSyncState: SAction<SyncState>;
  setAvailable: SAction<Array<ITutorialSummary>>;
  setSlugCreating: SAction<string>;
  clearSlugCreating: SAction;
  setAllowRandomChapterAccess: SAction<boolean>;
  setLanguageSelector: SAction<ResourceLanguageSelector>;
  loadSummaries: ASThunk;

  createProjectFromTutorial: ASThunk<CreateProjectFromTutorialArgs>;
  createDemoFromTutorial: ASThunk<string>;

  bootAllowRandomChapterAccessFromQuery: SThunk;
}

type NewProjectTextKind = "name" | "summary";
type NewProjectOriginKind = "tutorial" | "demo";

/** Return the (translated) name or summary for a new project which is
 * following, or is a demo of, the tutorial with the given
 * `displayName`. */
function newProjectText(
  textKind: NewProjectTextKind,
  originKind: NewProjectOriginKind,
  displayName: string
): string {
  return i18next.t(`new-project.${textKind}.${originKind}`, {
    ns: "tutorials",
    replace: { displayName },
  });
}

type ProjectCreationArgs = {
  name: string;
  options: CreateProjectOptions;
};

type ProjectCreationArgsFun = () => Promise<ProjectCreationArgs>;

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
    navigateOptions?: () => NavigateOptions;
  }
) => {
  const storeActions = helpers.getStoreActions();

  // TODO: This is annoying because we're going to request the tutorial content
  // twice.  Once now, and once when we navigate to the IDE and it notices the
  // project is linked to a tutorial.  Change the IDE logic to more 'ensure we
  // have tutorial' rather than 'fetch tutorial'?

  actions.setSlugCreating(tutorialSlug);

  const createProjectArgs = await methods.projectCreationArgs();
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
  // belonging to the newly-created project, because when we navigate to
  // the new project the front-end will fetch that information afresh.
  // TODO: Some kind of cache layer so we don't push then fetch the
  // exact same information.
  //
  // Use loop not Promise.all() to ensure assets are added in correct
  // order:
  for (const url of assetURLs) {
    await addRemoteAssetToProject(project.id, url);
  }

  actions.clearSlugCreating();
  methods.completionAction();
  storeActions.projectCollection.noteDatabaseChange();
  storeActions.navigationRequestQueue.enqueue({
    path: `/ide/${project.id}`,
    opts: methods.navigateOptions?.(),
  });
};

/** Return a new `CreateProjectOptions` instance specifying that the
 * to-be-created project should be linked to the tutorial with the given
 * `tutorialSlug`, starting at the chapter with the given
 * `chapterIndex`.  As a special case, if `chapterIndex` is `-1`,
 * instead return options specifying a "demo", i.e., that the project
 * should have the content of the finished tutorial, but not be linked
 * to anything.  In either case, the project's summary will describe its
 * origin.
 */
const jrTutorialCheckpointCreateOptions = async (
  tutorialSlug: string,
  displayName: string,
  chapterIndex: number
): Promise<CreateProjectOptions> => {
  const relativeUrl = `${tutorialSlug}/chapter-starts.json`;
  const demoRequested = chapterIndex === -1;

  const checkpointsObj = await tutorialResourceParsedJson(relativeUrl);

  // TODO: Parse with zod to validate structure.
  const checkpoints = checkpointsObj as Array<JrTutorialCheckpointSkeleton>;

  const checkpoint = demoRequested
    ? checkpoints[checkpoints.length - 1]
    : checkpoints[chapterIndex];

  if (checkpoint == null) {
    throw new Error(
      `chapter ${chapterIndex} not found in` +
        ` ${checkpoints.length}-element list of` +
        ` chapter-starts for tutorial "${tutorialSlug}"`
    );
  }

  const skeleton = checkpoint.programSkeleton;
  const embodyContext = new EmbodyDemoFromTutorial(tutorialSlug);
  const jrProgram = StructuredProgramOps.fromSkeleton(skeleton, embodyContext);
  const program = PytchProgramOps.fromStructuredProgram(jrProgram);
  const assets = await embodyContext.allAddAssetDescriptors();

  const linkedContentRef: LinkedContentRef = demoRequested
    ? kLinkedContentRefNone
    : {
        kind: "jr-tutorial",
        name: tutorialSlug,
        interactionState: checkpoint.interactionState,
      };

  const summary = newProjectText(
    "summary",
    demoRequested ? "demo" : "tutorial",
    displayName
  );

  return {
    summary,
    linkedContentRef,
    program,
    assets,
  };
};

export const tutorialCollection: ITutorialCollection = {
  syncState: SyncState.SyncNotStarted,
  available: [],
  maybeSlugCreating: undefined,
  allowRandomChapterAccess: false,
  languageSelector: "all",

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

  setAllowRandomChapterAccess: propSetterAction("allowRandomChapterAccess"),
  setLanguageSelector: propSetterAction("languageSelector"),

  loadSummaries: thunk(async (actions) => {
    actions.setSyncState(SyncState.SyncingFromBackEnd);
    const summaries = await allTutorialSummaries();
    actions.setAvailable(withUniqueTutorialLanguages(summaries));
    actions.setSyncState(SyncState.Syncd);
  }),

  createProjectFromTutorial: thunk(async (actions, args, helpers) => {
    const tutorialSlug = args.slug;
    const navigateWithReplace = args.navigateWithReplace ?? false;
    await createProjectFromTutorial(actions, tutorialSlug, helpers, {
      projectCreationArgs: async () => {
        const content = await tutorialContent(tutorialSlug);
        const displayName = content.metadata.displayName;

        // TODO: Can this be tidied up?
        const options: CreateProjectOptions = await (async () => {
          switch (content.metadata.programKind) {
            case "flat": {
              if (args.chapterIndex !== 0) {
                throw new Error(
                  'cannot create project for "flat" tutorial other than at start'
                );
              }

              return {
                summary: newProjectText("summary", "tutorial", displayName),
                linkedContentRef: {
                  kind: "flat-tutorial",
                  name: tutorialSlug,
                  interactionState: { chapterIndex: 0 },
                },
                program: PytchProgramOps.fromPythonCode(content.initialCode),
              };
            }
            case "per-method": {
              return jrTutorialCheckpointCreateOptions(
                tutorialSlug,
                displayName,
                args.chapterIndex
              );
            }
            default:
              return assertNever(content.metadata.programKind);
          }
        })();

        return {
          name: newProjectText("name", "tutorial", displayName),
          options,
        };
      },
      completionAction: () => {
        helpers.getStoreActions().ideLayout.dismissButtonTour();
      },
      navigateOptions: () => ({ replace: navigateWithReplace }),
    });
  }),

  createDemoFromTutorial: thunk(async (actions, tutorialSlug, helpers) => {
    await createProjectFromTutorial(actions, tutorialSlug, helpers, {
      projectCreationArgs: async () => {
        const content = await tutorialContent(tutorialSlug);
        const displayName = content.metadata.displayName;
        const summary = newProjectText("summary", "demo", displayName);
        const options: CreateProjectOptions = await (async () => {
          switch (content.metadata.programKind) {
            case "flat": {
              const program = PytchProgramOps.fromPythonCode(
                content.completeCode
              );
              return { summary, program };
            }
            case "per-method": {
              return jrTutorialCheckpointCreateOptions(
                tutorialSlug,
                displayName,
                -1
              );
            }
            default:
              return assertNever(content.metadata.programKind);
          }
        })();

        return {
          name: newProjectText("name", "demo", displayName),
          options,
        };
      },
      completionAction: () => {
        helpers.getStoreActions().ideLayout.initiateButtonTour();
      },
    });
  }),

  bootAllowRandomChapterAccessFromQuery: thunk((actions) => {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.searchParams);
    if (params.has(kAllowRandomChapterAccessSearchParam)) {
      // Enable in app:
      actions.setAllowRandomChapterAccess(true);
      // And remove (just) that search param from URL:
      params.delete(kAllowRandomChapterAccessSearchParam);
      url.search = params.toString();
      window.history.replaceState(null, "", url);
    }
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
