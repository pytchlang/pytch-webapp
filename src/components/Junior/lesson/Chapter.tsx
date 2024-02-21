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

  // TODO: Assert that chunks[0] is header, which we have ~consumed in
  // header bar.
  const body = chapter.chunks.slice(1).map((chunk, chunkIdx) => {
    const keyPath = `${chapter.index}/${chunkIdx}`;
    return <ChapterChunk key={keyPath} keyPath={keyPath} chunk={chunk} />;
  });
  return <div className="Lesson-Chapter">{body}</div>;
};
