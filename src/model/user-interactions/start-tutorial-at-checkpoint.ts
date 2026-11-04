import { IPytchAppModel, PytchAppModelActions } from "..";
import { failIfNull, parsedHtmlBody } from "../../utils";
import { patchImageSrcURLs, tutorialResourceText } from "../tutorial";
import {
  TutorialLanguage,
  tutorialMetadataFromElement,
} from "../tutorial-metadata";
import {
  alwaysSubmittable,
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  VoidOutcome,
} from "./async-user-flow";

type StartTutorialAtCheckpointRunArgs = {
  mSlug?: string;
  mChapterIndexStr?: string;
};

type ValidatedRunArgs = {
  slug: string;
  chapterIndex: number;
};

type StartTutorialAtCheckpointRunState = ValidatedRunArgs & {
  displayName: string;
  language: TutorialLanguage;
  displaySummary: Array<ChildNode>;
};

export type StartTutorialAtCheckpointFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  StartTutorialAtCheckpointRunArgs,
  StartTutorialAtCheckpointRunState
>;

function validatedArgs(
  args: StartTutorialAtCheckpointRunArgs
): ValidatedRunArgs {
  const slug = args.mSlug;
  if (slug == null) throw new Error("no tutorial slug found in parameters");

  const chapterIndex = parseInt(args.mChapterIndexStr ?? "");
  if (isNaN(chapterIndex))
    throw new Error("no/bad chapter index found in parameters");

  return { slug, chapterIndex };
}

async function prepare(
  args: StartTutorialAtCheckpointRunArgs
): Promise<StartTutorialAtCheckpointRunState> {
  const { slug, chapterIndex } = validatedArgs(args);

  const summaryRelUrl = `${slug}/summary.html`;
  const summaryHtmlText = await tutorialResourceText(summaryRelUrl);
  const summaryHtml = parsedHtmlBody(summaryHtmlText, summaryRelUrl);

  // There is some duplication between here and allTutorialSummaries().
  // Tidy up somehow?

  let summaryDiv = failIfNull(
    summaryHtml.querySelector<HTMLDivElement>("div.tutorial-summary"),
    "no tutorial-summary div found"
  );

  const metadata = tutorialMetadataFromElement(summaryDiv, summaryRelUrl);
  const displayName = metadata.displayName;

  patchImageSrcURLs(slug, summaryDiv);

  // The title (H1) will be rendered separately, from displayName.
  const displaySummary = Array.from(summaryDiv.childNodes).filter(
    (node) => node.nodeName !== "H1"
  );

  const language = metadata.language;

  return { slug, chapterIndex, displayName, language, displaySummary };
}

async function attempt(
  runState: StartTutorialAtCheckpointRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  await actions.tutorialCollection.createProjectFromTutorial({
    slug: runState.slug,
    chapterIndex: runState.chapterIndex,
    navigateWithReplace: true,
  });

  return noModalWithVoid;
}

// No "pulse notable change" needed because the only non-error outcome
// is that the user is now looking at a newly-created project, making it
// obvious that the action has had the desired effect.

export let startTutorialAtCheckpointFlow: StartTutorialAtCheckpointFlow =
  asyncUserFlowSlice(
    {},
    { prepare, isSubmittable: alwaysSubmittable, attempt }
  );
