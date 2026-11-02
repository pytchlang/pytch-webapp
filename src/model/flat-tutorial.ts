import { PytchProgramKind } from "./pytch-program-types";
import {
  ITutorialContent,
  tutorialContentFromHTML,
  tutorialResourceText,
} from "./tutorial";
import * as z from "zod/mini";

const zFlatTutorialInteractionState = z.object({
  chapterIndex: z.number(),
});

/** The state of the learner's interaction with a "flat" tutorial.  All
 * of this is persistent in the local IndexedDB. */
export type FlatTutorialInteractionState = z.infer<
  typeof zFlatTutorialInteractionState
>;

export const zLinkedFlatTutorialRef = z.object({
  kind: z.literal("flat-tutorial"),
  name: z.string(),
  interactionState: zFlatTutorialInteractionState,
});
export type LinkedFlatTutorialRef = z.infer<typeof zLinkedFlatTutorialRef>;

export type LinkedFlatTutorial = {
  kind: "flat-tutorial";
  content: ITutorialContent;
  interactionState: FlatTutorialInteractionState;
};

export async function flatTutorialContentFromName(
  name: string
): Promise<ITutorialContent> {
  const rawHTML = await tutorialResourceText(`${name}/tutorial.html`);
  return tutorialContentFromHTML(name, rawHTML);
}

/** Construct a {@link LinkedFlatTutorial} from a
 * {@link LinkedFlatTutorialRef}.  This involves fetching the tutorial
 * content, and ensuring the interaction state is consistent with the
 * structure of the fetched content. */
export async function dereferenceLinkedFlatTutorial(
  programKind: PytchProgramKind,
  ref: LinkedFlatTutorialRef
): Promise<LinkedFlatTutorial> {
  if (programKind !== "flat") {
    throw new Error(`project is "${programKind}" but tutorial is "flat"`);
  }

  const content = await flatTutorialContentFromName(ref.name);

  // Under normal use, the chapterIndex will always be valid.  However,
  // if the tutorial has been updated, or when a tutorial author is
  // using live-reload, the chapterIndex might be beyond the end of the
  // tutorial as it currently is served by the tutorial server.
  const maxChapterIndex = content.chapters.length - 1;
  const rawChapterIndex = ref.interactionState.chapterIndex;
  const chapterIndex = Math.min(maxChapterIndex, rawChapterIndex);

  return {
    kind: "flat-tutorial",
    content,
    interactionState: { chapterIndex },
  };
}

/** Construct a {@link LinkedFlatTutorialRef} from a
 * {@link LinkedFlatTutorial}, by replacing the tutorial's content with
 * its name. */
export function makeLinkedFlatTutorialRef(
  tutorial: LinkedFlatTutorial
): LinkedFlatTutorialRef {
  return {
    kind: "flat-tutorial",
    name: tutorial.content.slug,
    interactionState: {
      chapterIndex: tutorial.interactionState.chapterIndex,
    },
  };
}
