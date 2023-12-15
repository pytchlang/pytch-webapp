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
  chapters: Array<JrTutorialChapter>;
};

export type JrTutorialInteractionState = {
  chapterIndex: number;
};

export class JrTutorialInteractionStateOps {
  static newInitial(): JrTutorialInteractionState {
    return { chapterIndex: 0 };
  }
}

export type LinkedJrTutorialRef = {
  kind: "jr-tutorial";
  name: string;
  interactionState: JrTutorialInteractionState;
};

export type LinkedJrTutorial = {
  kind: "jr-tutorial";
  name: string;
  content: JrTutorialContent;
  interactionState: JrTutorialInteractionState;
};

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

function learnerTaskFromDiv(div: HTMLElement): LearnerTask {
  const intro = ensureDivOfClass(div.childNodes[0], "learner-task-intro");

  let helpStages: Array<LearnerTaskHelpStage> = [];
  for (let i = 1; i !== div.childNodes.length; ++i) {
    const child = div.childNodes[i];
    helpStages.push(learnerTaskHelpStageFromElt(child as HTMLElement));
  }

  return { intro, helpStages };
}

export function jrTutorialContentFromHTML(
  slug: string,
  tutorialHtml: string,
  sourceLabel: string
): JrTutorialContent {
  const tutorialBody = parsedHtmlBody(tutorialHtml, sourceLabel);
  const tutorialDiv = tutorialBody.childNodes[0] as HTMLDivElement;

  patchImageSrcURLs(slug, tutorialDiv);

  let chapters: Array<JrTutorialChapter> = [];
  tutorialDiv.childNodes.forEach((chapterNode, index) => {
    const chapterDiv = chapterNode as HTMLDivElement;
    let chunks: Array<JrTutorialChapterChunk> = [];
    chapterDiv.childNodes.forEach((chunkNode) => {
      const chunkElt = chunkNode as HTMLElement;
      if (chunkElt.getAttribute("class") === "learner-task") {
        const task = learnerTaskFromDiv(chunkElt as HTMLDivElement);
        chunks.push({ kind: "learner-task", task });
      } else {
        chunks.push({ kind: "element", element: chunkElt });
      }
    });
    chapters.push({ index, chunks });
  });

  return { chapters };
}

export async function jrTutorialContentFromName(
  name: string
): Promise<JrTutorialContent> {
  const relativeUrl = `${name}/tutorial.html`;
  const html = await tutorialResourceText(relativeUrl);
  return jrTutorialContentFromHTML(name, html, relativeUrl);
}
