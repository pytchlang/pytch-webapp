import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  JrTutorialChapter,
  JrTutorialChapterTitle,
  LinkedJrTutorial,
} from "../../../model/junior/jr-tutorial";
import { EmptyProps, assertNever } from "../../../utils";
import { LearnerTask, TaskInteractivityKind } from "./LearnerTask";
import { RawOrCodeSnippet } from "./RawOrCodeSnippet";
import { focusChapterContent, useMappedLinkedJrTutorial } from "./hooks";
import { useUiLangAttribute } from "../hooks";
import { useStoreState } from "../../../store";

// This is more fiddly, but just using a <RawElement> inside the <UL>
// for the ToC leads to poor DOM structure (UL/LI/DIV/H2/text), which
// (reasonably enough) renders poorly on Safari.
type ToCEntryProps = { key: React.Key; title: JrTutorialChapterTitle };
const ToCEntry: React.FC<ToCEntryProps> = (props) => {
  const populate = (liElt: HTMLLIElement | null) => {
    if (liElt == null) return;
    if (liElt.dataset.contentPopulated === "yes") return;

    if (props.title.kind !== "html") {
      throw new Error('expecting "html" title in ToC');
    }

    props.title.elt.childNodes.forEach((node) => {
      liElt.appendChild(node.cloneNode(true));
    });

    liElt.dataset.contentPopulated = "yes";
  };

  return <li ref={populate} />;
};

const LessonTableOfContents: React.FC<{ key: React.Key }> = () => {
  const { t } = useTranslation("tutorials");
  const uiLang = useUiLangAttribute();
  const chapters = useMappedLinkedJrTutorial(
    (tutorial) => tutorial.content.chapters
  );

  // Omit first "chapter", which is the overall summary.
  const realChapters = chapters.slice(1);

  return (
    <div className="LessonTableOfContents">
      <h1 className="title" lang={uiLang}>
        {t("chapter.toc-title")}
      </h1>
      <ol className="toc-contents">
        {realChapters.map((chapter, idx) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <ToCEntry key={idx} title={chapter.title} />
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

export const Chapter: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("tutorials");
  const uiLang = useUiLangAttribute();
  const lastRenderedChapterRef = useRef<number>(-1);

  const state = useMappedLinkedJrTutorial(mapTutorial, eqState);
  const allowRandomChapterAccess = useStoreState(
    (state) => state.tutorialCollection.allowRandomChapterAccess
  );

  const chapterIndex = state.chapterIndex;

  useEffect(() => {
    if (chapterIndex !== lastRenderedChapterRef.current) {
      let cleanup = () => {};
      if (lastRenderedChapterRef.current !== -1) {
        const timeoutId = setTimeout(focusChapterContent);
        cleanup = () => clearTimeout(timeoutId);
      }
      lastRenderedChapterRef.current = chapterIndex;
      return cleanup;
    }
  }, [chapterIndex]);

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

    const keyPath = `${chapterIndex}/${chunkIdx}`;
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

  if (chapterIndex === 0) {
    const key = `${chapterIndex}/toc`;
    body.push(<LessonTableOfContents key={key} />);
  }

  if (!state.allChapterTasksDone && !allowRandomChapterAccess) {
    const key = `${chapterIndex}/hint`;
    body.push(
      <div key={key} className="hint-do-task-to-see-more" lang={uiLang}>
        {t("chapter.hint-do-task")}
      </div>
    );
  }

  return (
    <div className="Lesson-Chapter" aria-live="polite" aria-atomic="false">
      {body}
    </div>
  );
};
