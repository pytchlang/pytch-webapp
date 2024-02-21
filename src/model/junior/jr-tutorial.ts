import {
  assertNever,
  ensureDivOfClass,
  failIfNull,
  isDivOfClass,
  parsedHtmlBody,
} from "../../utils";
import { patchImageSrcURLs, tutorialResourceText } from "../tutorial";
import { EventDescriptor } from "./structured-program";

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

export type LearnerTaskCommitAddMedialibAppearance = {
  kind: "add-medialib-appearance";
  actor: ActorIdentifier;
  displayIdentifier: string;
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
  | LearnerTaskCommitAddMedialibAppearance
  | LearnerTaskCommitAddScript
  | LearnerTaskCommitEditScript
  | LearnerTaskCommitChangeHatBlock;

export type LearnerTaskHelpStageFragment =
  | { kind: "element"; element: HTMLElement }
  | { kind: "commit"; commit: LearnerTaskCommit };

export type LearnerTaskHelpStage = {
  fragments: Array<LearnerTaskHelpStageFragment>;
};

export type LearnerTask = {
  index: number;
  intro: HTMLDivElement;
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
  nTasksTotal: number;
  nTasksByChapter: Array<number>;
  nTasksBeforeChapter: Array<number>;
};

/** Aspects of the state of the learner's interaction with the lesson
 * which are persistent in the local IndexedDB. */
export type JrTutorialPersistentInteractionState = {
  chapterIndex: number;
  nTasksDone: number;
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

  return {
    kind: "jr-tutorial",
    content,
    interactionState: { chapterIndex, nTasksDone, taskStates },
  };
}

function learnerTaskCommitFromDiv(div: HTMLDivElement): LearnerTaskCommit {
  const jrCommitJson = failIfNull(
    div.dataset.jrCommit,
    "missing data-jr-commit attribute in DIV.jr-commit"
  );

  return JSON.parse(jrCommitJson) as LearnerTaskCommit;
}

function learnerTaskHelpStageFromElt(elt: HTMLElement): LearnerTaskHelpStage {
  const div = ensureDivOfClass(elt, "learner-task-help");
  let fragments: Array<LearnerTaskHelpStageFragment> = [];
  div.childNodes.forEach((node) => {
    if (isDivOfClass(node, "jr-commit")) {
      const commit = learnerTaskCommitFromDiv(node);
      fragments.push({ kind: "commit", commit });
    } else {
      fragments.push({ kind: "element", element: node as HTMLElement });
    }
  });
  return { fragments };
}

function learnerTaskFromDiv(taskIdx: number, div: HTMLElement): LearnerTask {
  const intro = ensureDivOfClass(div.childNodes[0], "learner-task-intro");

  let helpStages: Array<LearnerTaskHelpStage> = [];
  for (let i = 1; i !== div.childNodes.length; ++i) {
    const child = div.childNodes[i];
    helpStages.push(learnerTaskHelpStageFromElt(child as HTMLElement));
  }

  return { index: taskIdx, intro, helpStages };
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
  tutorialDiv.childNodes.forEach((chapterNode, index) => {
    const chapterDiv = chapterNode as HTMLDivElement;
    let nTasksThisChapter = 0;
    let chunks: Array<JrTutorialChapterChunk> = [];
    chapterDiv.childNodes.forEach((chunkNode) => {
      const chunkElt = chunkNode as HTMLElement;
      if (chunkElt.getAttribute("class") === "learner-task") {
        const task = learnerTaskFromDiv(taskIdx, chunkElt as HTMLDivElement);
        chunks.push({ kind: "learner-task", task });
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
    nTasksTotal,
    nTasksByChapter,
    nTasksBeforeChapter,
  };
}

export async function jrTutorialContentFromName(
  name: string
): Promise<JrTutorialContent> {
  const relativeUrl = `${name}/tutorial.html`;
  const html = await tutorialResourceText(relativeUrl);
  return jrTutorialContentFromHTML(name, html, relativeUrl);
}
