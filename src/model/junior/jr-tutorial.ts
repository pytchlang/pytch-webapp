import {
  assertNever,
  ensureDivOfClass,
  failIfNull,
  isDivOfClass,
} from "../../utils";
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
