import { withCodeSnippetsRendered } from "../../components/Junior/lesson/RawOrCodeSnippet";
import {
  assertNever,
  ensureDivOfClass,
  isDivOfClass,
  parsedHtmlBody,
} from "../../utils";
import { patchImageSrcURLs, tutorialResourceText } from "../tutorial";
import { EventDescriptor, Uuid } from "./structured-program";
import { ParsonsBlock } from "./structured-program/event";

// Use full word "Identifier" so as not to make people think it's a
// short numeric id, or a Uuid, or anything like that.
type ActorIdentifier = { kind: "stage" } | { kind: "sprite"; name: string };

export class ActorIdentifierOps {
  static nounPhrase(actorIdentifier: ActorIdentifier): string {
    switch (actorIdentifier.kind) {
      case "stage":
        return "the stage";
      case "sprite":
        return `the “${actorIdentifier.name}” sprite`;
      default:
        return assertNever(actorIdentifier);
    }
  }
}

type ScriptPath = {
  actor: ActorIdentifier;
  methodName: string; // Not sure whether/how we'll use this.
};

export type LearnerTaskCommitAddSprite = {
  kind: "add-sprite";
  name: string;
};

export type LearnerTaskCommitAddMedialibAppearancesEntry = {
  kind: "add-medialib-appearances-entry";
  actor: ActorIdentifier;
  displayIdentifier: string;
  nItems: number;
};

export type LearnerTaskCommitDeleteAppearance = {
  kind: "delete-appearance";
  actor: ActorIdentifier;
  appearanceFilename: string;
};

export type LearnerTaskCommitAddScript = {
  kind: "add-script";
  path: ScriptPath;
  event: EventDescriptor;
  codeText: string; // Can be empty.
};

export type LearnerTaskCommitEditScript = {
  kind: "edit-script";
  path: ScriptPath;
  event: EventDescriptor;
  oldCodeText: string;
  newCodeText: string;
};

export type LearnerTaskCommitChangeHatBlock = {
  kind: "change-hat-block";
  path: ScriptPath;
  codeText: string;
  oldEvent: EventDescriptor;
  newEvent: EventDescriptor;
};

export type LearnerTaskCommit =
  | LearnerTaskCommitAddSprite
  | LearnerTaskCommitAddMedialibAppearancesEntry
  | LearnerTaskCommitDeleteAppearance
  | LearnerTaskCommitAddScript
  | LearnerTaskCommitEditScript
  | LearnerTaskCommitChangeHatBlock;

// Should only encounter the "error" kind when developing tutorials,
// e.g., when the author mis-types a commit slug.
export type LearnerTaskHelpStageFragment =
  | { kind: "error"; element: HTMLElement; message: string }
  | { kind: "element"; element: HTMLElement }
  | { kind: "commit"; commit: LearnerTaskCommit };

export type LearnerTaskHelpStage = {
  fragments: Array<LearnerTaskHelpStageFragment>;
};

export type ParsonsPuzzleProps = {
  handlerKind: "green-flag" | "clicked";
  puzzleBlocks: Array<ParsonsBlock>;
}

export type LearnerTask = {
  index: number;
  intro: HTMLDivElement;
  puzzleData: ParsonsPuzzleProps;
  helpStages: Array<LearnerTaskHelpStage>;
};

export type JrTutorialChapterChunk =
  | { kind: "element"; element: HTMLElement }
  | { kind: "learner-task"; task: LearnerTask };

export type JrTutorialChapter = {
  index: number;
  includeInProgressTrail: boolean;
  chunks: Array<JrTutorialChapterChunk>;
};

export type JrTutorialContent = {
  name: string;
  chapters: Array<JrTutorialChapter>;
  realChapterTitles: Array<HTMLHeadingElement>;
  nTasksTotal: number;
  nTasksByChapter: Array<number>;
  nTasksBeforeChapter: Array<number>;
  puzzleFirstTaskByChapter: Array<boolean>;
  taskHasPuzzle: Array<boolean>; // might use this instead of the one above. if so it'll be to track each tasks state so it doesn't have to be fetched from the chunk in a diffwerent way to be updated on checkbox click
};

/** Aspects of the state of the learner's interaction with the lesson
 * which are persistent in the local IndexedDB. */
export type PersistentPuzzleStateDescriptor = {
  state: "unknown" | "not-present" | "not-started" | "finished";
} | {
  state: "in-progress";
  actorId: Uuid;
  handlerId: Uuid;
};
export type JrTutorialPersistentInteractionState = {
  chapterIndex: number;
  nTasksDone: number;
  puzzleState: PersistentPuzzleStateDescriptor;
};

/** The state of the learner's interaction with a particular task of the
 * lesson.  There is no slot here for "has the learner marked this task
 * as done?" because that information is represented by the `nTasksDone`
 * slot of the `JrTutorialPersistentInteractionState`. */
export type JrTutorialTaskInteractionState = {
  nHelpStagesShown: number;
};

/** Aspects of the state of the learner's interaction with the lesson
 * which only exist while the learner is using the app. */
export type JrTutorialEphemeralInteractionState = {
  taskStates: Array<JrTutorialTaskInteractionState>;
};

export type JrTutorialInteractionState = JrTutorialPersistentInteractionState &
  JrTutorialEphemeralInteractionState;

export type LinkedJrTutorialRef = {
  kind: "jr-tutorial";
  name: string;
  interactionState: JrTutorialPersistentInteractionState;
};

export type LinkedJrTutorial = {
  kind: "jr-tutorial";
  content: JrTutorialContent;
  interactionState: JrTutorialInteractionState;
};

/** Construct a {@link LinkedJrTutorial} from a
 * {@link LinkedJrTutorialRef}.  This involves fetching the tutorial
 * content, ensuring the {@link JrTutorialPersistentInteractionState}
 * part of the interaction state is consistent with the structure of the
 * fetched content, and constructing the
 * {@link JrTutorialEphemeralInteractionState} part of the interaction
 * state.
 * */
export async function dereferenceLinkedJrTutorial(
  ref: LinkedJrTutorialRef
): Promise<LinkedJrTutorial> {
  const content = await jrTutorialContentFromName(ref.name);

  const taskStates: Array<JrTutorialTaskInteractionState> = [];
  for (let i = 0; i < content.nTasksTotal; ++i)
    taskStates.push({ nHelpStagesShown: 0 });

  // Ensure interaction state is consistent.  In normal use it will be,
  // but if the tutorial gets updated then we have to make sure.

  const maxChapterIndex = content.chapters.length - 1;
  const rawChapterIndex = ref.interactionState.chapterIndex;
  const chapterIndex = Math.min(maxChapterIndex, rawChapterIndex);

  const rawNTasksDone = ref.interactionState.nTasksDone;
  const maxNTasksDone = content.nTasksTotal;
  const nTasksDone = Math.min(maxNTasksDone, rawNTasksDone);
  const puzzleState = ref.interactionState.puzzleState;

  return {
    kind: "jr-tutorial",
    content,
    interactionState: { chapterIndex, nTasksDone, taskStates, puzzleState },
  };
}

/** Construct a {@link LinkedJrTutorialRef} from a
 * {@link LinkedJrTutorial}.  This involves projecting the interaction
 * state down to just the {@link JrTutorialPersistentInteractionState}
 * part, and replacing the tutorial's content with its name. */
export function makeLinkedJrTutorialRef(
  tutorial: LinkedJrTutorial
): LinkedJrTutorialRef {
  return {
    kind: "jr-tutorial",
    name: tutorial.content.name,
    interactionState: {
      chapterIndex: tutorial.interactionState.chapterIndex,
      nTasksDone: tutorial.interactionState.nTasksDone,
      puzzleState: tutorial.interactionState.puzzleState,
    },
  };
}

export function allTasksDoneInCurrentChapter(
  tutorial: LinkedJrTutorial
): boolean {
  const { content, interactionState } = tutorial;
  const chapterIndex = interactionState.chapterIndex;
  const nTasksInclChapter = content.nTasksBeforeChapter[chapterIndex + 1];
  const nTasksDone = interactionState.nTasksDone;
  return nTasksDone >= nTasksInclChapter;
}

function learnerTaskFragmentFromDiv(
  div: HTMLDivElement
): LearnerTaskHelpStageFragment {
  const jrCommitJson = div.dataset.jrCommit;
  if (jrCommitJson != null) {
    return {
      kind: "commit",
      commit: JSON.parse(jrCommitJson) as LearnerTaskCommit,
    };
  } else {
    return {
      kind: "error",
      element: div,
      message: "No data-jr-commit in DIV",
    };
  }
}

function learnerTaskHelpStageFromElt(elt: HTMLElement): LearnerTaskHelpStage {
  const div = ensureDivOfClass(elt, "learner-task-help");
  let fragments: Array<LearnerTaskHelpStageFragment> = [];
  div.childNodes.forEach((node) => {
    if (isDivOfClass(node, "jr-commit")) {
      fragments.push(learnerTaskFragmentFromDiv(node));
    } else {
      fragments.push({ kind: "element", element: node as HTMLElement });
    }
  });
  return { fragments };
}

function puzzleBlocksFromElt(elt: Element): ParsonsBlock {
  // doing it here handles "&gt" and simillar in the block code (may not be the cleanest way) as well as formatting the code for display
  let codeAsElement = document.createElement("pre");
  codeAsElement.innerHTML = `<code class="language-python">${elt.innerHTML.substring(6)} </code>`;
  const formattedCode = withCodeSnippetsRendered(codeAsElement);

  return { id: +elt.innerHTML.charAt(0), index: +elt.innerHTML.charAt(2), indent: +elt.innerHTML.charAt(4), code: formattedCode }
}

function learnerTaskFromDiv(taskIdx: number, div: HTMLElement): LearnerTask {
  const intro = ensureDivOfClass(div.childNodes[0], "learner-task-intro");

  let puzzleBlocks: Array<ParsonsBlock> = [];
  let handlerKind : "green-flag" | "clicked" = "green-flag";
  let nextNodeIdx: number = 1;

  try{
    const puzzleDiv = ensureDivOfClass(div.childNodes[1], "parsons-puzzle");
    if(puzzleDiv.children[0].innerHTML === "green-flag" || puzzleDiv.children[0].innerHTML === "clicked") {
      handlerKind = puzzleDiv.children[0].innerHTML;
    }
    for (let i = 0; i !== puzzleDiv.children[1].children.length; i++) {
      const child = puzzleDiv.children[1].children[i];
      puzzleBlocks.push(puzzleBlocksFromElt(child));
    }
    nextNodeIdx = 2;
  }
  catch(error) { /* do nothing */ }
  let puzzleData: ParsonsPuzzleProps = { handlerKind: handlerKind, puzzleBlocks: puzzleBlocks };

  let helpStages: Array<LearnerTaskHelpStage> = [];
  for (let i = nextNodeIdx; i !== div.childNodes.length; ++i) {
    const child = div.childNodes[i];
    helpStages.push(learnerTaskHelpStageFromElt(child as HTMLElement));
  }

  return { index: taskIdx, intro: intro, puzzleData: puzzleData, helpStages: helpStages };
}

export function jrTutorialContentFromHTML(
  slug: string,
  tutorialHtml: string,
  sourceLabel: string
): JrTutorialContent {
  const tutorialBody = parsedHtmlBody(tutorialHtml, sourceLabel);
  const tutorialDiv = tutorialBody.childNodes[0] as HTMLDivElement;

  patchImageSrcURLs(slug, tutorialDiv);

  let taskIdx = 0;
  let chapters: Array<JrTutorialChapter> = [];
  let nTasksByChapter: Array<number> = [];
  let realChapterTitles: Array<HTMLHeadingElement> = [];
  let puzzleFirstTaskByChapter: Array<boolean> = [];
  let taskHasPuzzle: Array<boolean> = []; // this or that^
  tutorialDiv.childNodes.forEach((chapterNode, index) => {
    const chapterDiv = chapterNode as HTMLDivElement;

    // Accumulate the non-intro titles:
    if (index !== 0)
      realChapterTitles.push(
        chapterDiv.childNodes.item(0).cloneNode(true) as HTMLHeadingElement
      );

    let nTasksThisChapter = 0;
    let chunks: Array<JrTutorialChapterChunk> = [];
    chapterDiv.childNodes.forEach((chunkNode) => {
      const chunkElt = chunkNode as HTMLElement;
      if (chunkElt.getAttribute("class") === "learner-task") {
        const task = learnerTaskFromDiv(taskIdx, chunkElt as HTMLDivElement);
        chunks.push({ kind: "learner-task", task });
        if (nTasksThisChapter == 0) {
          puzzleFirstTaskByChapter.push(task.puzzleData.puzzleBlocks.length > 0);
        }
        taskHasPuzzle.push(task.puzzleData.puzzleBlocks.length > 0); // this or that^
        ++taskIdx;
        ++nTasksThisChapter;
      } else {
        chunks.push({ kind: "element", element: chunkElt });
      }
    });

    nTasksByChapter.push(nTasksThisChapter);

    // If the "data-exclude-from-progress-trail" attribute is absent,
    // that counts as "false", i.e., do include it.
    const includeInProgressTrail =
      chapterDiv.dataset.excludeFromProgressTrail !== "true";

    chapters.push({ index, includeInProgressTrail, chunks });
  });

  let nTasksTotal = 0;
  let nTasksBeforeChapter = [nTasksTotal];
  for (const nTasks of nTasksByChapter) {
    nTasksTotal += nTasks;
    nTasksBeforeChapter.push(nTasksTotal);
  }

  return {
    name: slug,
    chapters,
    realChapterTitles,
    nTasksTotal,
    nTasksByChapter,
    nTasksBeforeChapter,
    puzzleFirstTaskByChapter,
    taskHasPuzzle,  // this or that^
  };
}

export async function jrTutorialContentFromName(
  name: string
): Promise<JrTutorialContent> {
  const relativeUrl = `${name}/tutorial.html`;
  const html = await tutorialResourceText(relativeUrl);
  return jrTutorialContentFromHTML(name, html, relativeUrl);
}
