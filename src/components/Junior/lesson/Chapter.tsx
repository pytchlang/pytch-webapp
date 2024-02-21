import React from "react";
import {
  JrTutorialChapter,
  LinkedJrTutorial,
} from "../../../model/junior/jr-tutorial";
import { EmptyProps, assertNever } from "../../../utils";
import { LearnerTask } from "./LearnerTask";
import { RawOrScratchBlock } from "./RawOrScratchBlock";
import { useMappedLinkedJrTutorial } from "./hooks";

type ChapterState = {
  chapter: JrTutorialChapter;
  chapterIndex: number;
  nTasksDone: number;
  nTasksBeforeChapter: number;
  allChapterTasksDone: boolean;
};

function mapTutorial(tutorial: LinkedJrTutorial): ChapterState {
  const { content, interactionState } = tutorial;
  const chapterIndex = interactionState.chapterIndex;
  const chapter = content.chapters[chapterIndex];
  const nTasksDone = interactionState.nTasksDone;
  const nTasksBeforeChapter = content.nTasksBeforeChapter[chapterIndex];
  const nTasksInclChapter = content.nTasksBeforeChapter[chapterIndex + 1];
  const allChapterTasksDone = nTasksDone >= nTasksInclChapter;
  return {
    chapter,
    chapterIndex,
    nTasksDone,
    nTasksBeforeChapter,
    allChapterTasksDone,
  };
}

function eqState(s1: ChapterState, s2: ChapterState): boolean {
  return (
    s1.chapter === s2.chapter &&
    s1.chapterIndex === s2.chapterIndex &&
    s1.nTasksDone === s2.nTasksDone &&
    s1.nTasksBeforeChapter === s2.nTasksBeforeChapter &&
    s1.allChapterTasksDone === s2.allChapterTasksDone
  );
}

function taskInteractionKind(state: ChapterState, taskIdx: number) {
  return taskIdx === state.nTasksDone
    ? "current"
    : taskIdx === state.nTasksDone - 1
    ? "previous"
    : "old";
}

export const Chapter: React.FC<EmptyProps> = () => {
  const state = useMappedLinkedJrTutorial(mapTutorial, eqState);

  let body: Array<React.JSX.Element> = [];
  let chunkIdx = 0;
  let taskIdx = state.nTasksBeforeChapter;
  for (const chunk of state.chapter.chunks) {
    if (chunkIdx === 0) {
      // Skip H2 for chapter title; we've used it in the header bar.
      // TODO: Assert it really is the H2 we're expecting.
      ++chunkIdx;
      continue;
    }

    const keyPath = `${state.chapterIndex}/${chunkIdx}`;
    switch (chunk.kind) {
      case "element":
        body.push(<RawOrScratchBlock key={keyPath} element={chunk.element} />);
        break;
      case "learner-task": {
        const kind = taskInteractionKind(state, taskIdx);
        body.push(
          <LearnerTask
            key={keyPath}
            keyPath={keyPath}
            task={chunk.task}
            kind={kind}
          />
        );
        ++taskIdx;
        break;
      }
      default:
        return assertNever(chunk);
    }

    if (taskIdx > state.nTasksDone) {
      break;
    }

    ++chunkIdx;
  }

  if (!state.allChapterTasksDone) {
    const key = `${state.chapterIndex}/hint`;
    body.push(
      <div key={key} className="my-3 hint-do-task-to-see-more">
        (You’ll see the next step once you’ve marked this task as done.)
      </div>
    );
  }

  return <div className="Lesson-Chapter">{body}</div>;
};
