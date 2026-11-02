import { ITutorialContent } from "./tutorial";
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
