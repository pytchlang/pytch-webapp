import React from "react";
import {
  JrTutorialChapter,
  JrTutorialChapterChunk,
} from "../../../model/junior/jr-tutorial";
import { assertNever } from "../../../utils";
import { LearnerTask } from "./LearnerTask";
import { RawOrScratchBlock } from "./RawOrScratchBlock";

type ChapterChunkProps = { keyPath: string; chunk: JrTutorialChapterChunk };
const ChapterChunk: React.FC<ChapterChunkProps> = ({ keyPath, chunk }) => {
  switch (chunk.kind) {
    case "element":
      return <RawOrScratchBlock element={chunk.element} />;
    case "learner-task":
      return <LearnerTask key={keyPath} keyPath={keyPath} task={chunk.task} />;
    default:
      return assertNever(chunk);
  }
};

type ChapterProps = { chapter: JrTutorialChapter };
export const Chapter: React.FC<ChapterProps> = ({ chapter }) => {
  // TODO: Assert that chunks[0] is header, which we have ~consumed in
  // header bar.
  const body = chapter.chunks.slice(1).map((chunk, chunkIdx) => {
    const keyPath = `${chapter.index}/${chunkIdx}`;
    return <ChapterChunk key={keyPath} keyPath={keyPath} chunk={chunk} />;
  });
  return <div className="Lesson-Chapter">{body}</div>;
};
