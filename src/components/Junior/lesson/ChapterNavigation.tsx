import React from "react";
import { EmptyProps } from "../../../utils";
import { Button } from "react-bootstrap";
import { useLinkedJrTutorial } from "./hooks";
import { useStoreActions } from "../../../store";
import classNames from "classnames";
import {
  LinkedJrTutorial,
  allTasksDoneInCurrentChapter,
} from "../../../model/junior/jr-tutorial";

type ChapterNavigationState = {
  allChapterTasksDone: boolean;
  chapterIdx: number;
  nChapters: number;
};

function mapTutorial(tutorial: LinkedJrTutorial): ChapterNavigationState {
  const allChapterTasksDone = allTasksDoneInCurrentChapter(tutorial);
  const chapterIdx = tutorial.interactionState.chapterIndex;
  const nChapters = tutorial.content.chapters.length;
  return { allChapterTasksDone, chapterIdx, nChapters };
}

function eqState(
  s1: ChapterNavigationState,
  s2: ChapterNavigationState
): boolean {
  return (
    s1.allChapterTasksDone === s2.allChapterTasksDone &&
    s1.chapterIdx === s2.chapterIdx &&
    s1.nChapters === s2.nChapters
  );
}

export const ChapterNavigation: React.FC<EmptyProps> = () => {
  const linkedTutorial = useLinkedJrTutorial();
  const setChapterIndex = useStoreActions(
    (actions) => actions.activeProject.setLinkedLessonChapterIndex
  );

  const curChapIdx = linkedTutorial.interactionState.chapterIndex;
  const nChapters = linkedTutorial.content.chapters.length;

  const nextIsEnabled = curChapIdx < nChapters - 1;
  const prevIsEnabled = curChapIdx > 0;

  const prevChapter = () => {
    if (prevIsEnabled) setChapterIndex(curChapIdx - 1);
  };
  const nextChapter = () => {
    if (nextIsEnabled) setChapterIndex(curChapIdx + 1);
  };

  const prevClasses = classNames("prev", { isEnabled: prevIsEnabled });
  const nextClasses = classNames("next", { isEnabled: nextIsEnabled });

  return (
    <div className="Junior-ChapterNavigation">
      <Button className={prevClasses} onClick={prevChapter}>
        Back
      </Button>
      <Button className={nextClasses} onClick={nextChapter}>
        Next
      </Button>
    </div>
  );
};
