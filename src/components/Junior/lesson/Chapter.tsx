import React, { useEffect, useRef } from "react";
import {
  JrTutorialChapter,
  LinkedJrTutorial,
} from "../../../model/junior/jr-tutorial";
import { EmptyProps, assertNever } from "../../../utils";
import { LearnerTask, TaskInteractivityKind } from "./LearnerTask";
import { RawOrCodeSnippet } from "./RawOrCodeSnippet";
import { useMappedLinkedJrTutorial } from "./hooks";
import { useStoreState } from "../../../store";

// This is more fiddly, but just using a <RawElement> inside the <UL>
// for the ToC leads to poor DOM structure (UL/LI/DIV/H2/text), which
// (reasonably enough) renders poorly on Safari.
type ToCEntryProps = { key: React.Key; titleElt: HTMLElement };
const ToCEntry: React.FC<ToCEntryProps> = (props) => {
  const liRef = React.createRef<HTMLLIElement>();

  useEffect(() => {
    let liElt = liRef.current;
    if (liElt == null) return;

    props.titleElt.childNodes.forEach((node) => {
      liElt.appendChild(node.cloneNode(true));
    });

    return () => {
      liElt.innerHTML = "";
    };
  }, [liRef]);

  return <li ref={liRef} />;
};

const LessonTableOfContents: React.FC<{ key: React.Key }> = () => {
  const chapters = useMappedLinkedJrTutorial(
    (tutorial) => tutorial.content.chapters
  );

  // Omit first "chapter", which is the overall summary.
  const realChapters = chapters.slice(1);

  return (
    <div className="LessonTableOfContents">
      <h1 className="title">Summary of this project’s steps:</h1>
      <ol className="toc-contents">
        {realChapters.map((chapter, idx) => (
          <ToCEntry key={idx} titleElt={chapter.titleElt} />
        ))}
      </ol>
    </div>
  );
};

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

function taskInteractionKind(
  state: ChapterState,
  taskIdx: number
): TaskInteractivityKind {
  return taskIdx > state.nTasksDone
    ? "future"
    : taskIdx === state.nTasksDone
    ? "current"
    : taskIdx === state.nTasksDone - 1
    ? "previous"
    : "old";
}

function focusChapterContent() {
  const contentElts = document.getElementsByClassName("Junior-LessonContent");

  const nElts = contentElts.length;
  if (nElts !== 1) {
    console.warn(`focusChapterContent(): Found ${nElts} elts`);
  }
  if (nElts > 0) {
    const targetElement = contentElts[0] as HTMLElement;
    targetElement.focus();
  }
}

export const Chapter: React.FC<EmptyProps> = () => {
  const lastRenderedChapter = useRef<number>(-1);

  const state = useMappedLinkedJrTutorial(mapTutorial, eqState);
  const allowRandomChapterAccess = useStoreState(
    (state) => state.tutorialCollection.allowRandomChapterAccess
  );

  if (state.chapterIndex !== lastRenderedChapter.current) {
    if (lastRenderedChapter.current !== -1) {
      setTimeout(focusChapterContent);
    }
    lastRenderedChapter.current = state.chapterIndex;
  }

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
        body.push(<RawOrCodeSnippet key={keyPath} element={chunk.element} />);
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

    if (taskIdx > state.nTasksDone && !allowRandomChapterAccess) {
      break;
    }

    ++chunkIdx;
  }

  if (state.chapterIndex === 0) {
    const key = `${state.chapterIndex}/toc`;
    body.push(<LessonTableOfContents key={key} />);
  }

  if (!state.allChapterTasksDone && !allowRandomChapterAccess) {
    const key = `${state.chapterIndex}/hint`;
    body.push(
      <div key={key} className="hint-do-task-to-see-more">
        (You’ll see the next step once you’ve marked this task as done.)
      </div>
    );
  }

  return (
    <div className="Lesson-Chapter" aria-live="polite" aria-atomic="false">
      {body}
    </div>
  );
};
