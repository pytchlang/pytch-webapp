import React from "react";
import { useStoreState, useStoreActions } from "../store";
import { SyncState } from "../model/project";
import RawElement from "./RawElement";

interface TutorialNavigationProps {
  kind: "prev" | "next";
  toChapterIndex: number;
}

const TutorialNavigation = ({
  kind,
  toChapterIndex,
}: TutorialNavigationProps) => {
  const chapters = useStoreState(
    (state) => state.activeTutorial.tutorial?.chapters
  );

  if (chapters == null) {
    throw Error("no chapters to create navigation element");
  }

  const navigateToChapter = useStoreActions(
    (actions) => actions.activeTutorial.navigateToChapter
  );

  const navigateToTargetChapter = () => navigateToChapter(toChapterIndex);

  const toChapterTitle = chapters[toChapterIndex].title;

  // TODO: Turn 'kind' into something more human-friendly.
  return (
    <span onClick={navigateToTargetChapter}>
      {kind}: {toChapterTitle}
    </span>
  );
};
