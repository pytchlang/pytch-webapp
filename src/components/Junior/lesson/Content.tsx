import React, { createRef, useEffect } from "react";
import { EmptyProps } from "../../../utils";
import { useLinkedJrTutorial } from "./hooks";
import { ChapterNavigation } from "./ChapterNavigation";
import { Chapter } from "./Chapter";
import { ProgressTrail } from "./ProgressTrail";
import { DivScroller } from "./DivScroller";
import { useStoreActions } from "../../../store";
import { stageWidth } from "../../../constants";

const minStageWidth = (2 * stageWidth) / 3;

const WidthMonitor: React.FC<EmptyProps> = () => {
  const setStageDisplayWidth = useStoreActions(
    (actions) => actions.ideLayout.setStageDisplayWidth
  );

  const handleResize = () => {
    // TODO: This "1100" is a bit magic; it came from the min width of
    // the first two columns (512 each) then adding a bit.  Do something
    // more sensible for this.
    //
    // TODO: Various places that use the displaySize state should
    // provide a custom equality function to avoid needless
    // re-rendering.
    //
    const stageWdToFill = window.innerWidth - 1100;
    const targetWidth = Math.min(
      stageWidth,
      Math.max(minStageWidth, stageWdToFill)
    );
    setStageDisplayWidth(targetWidth);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  return null;
};

export const Content: React.FC<EmptyProps> = () => {
  const contentRef = createRef<HTMLDivElement>();

  const linkedTutorial = useLinkedJrTutorial();
  const tutorial = linkedTutorial.content;
  const interactionState = linkedTutorial.interactionState;

  // In normal use, the chapter index should always be in range, but if
  // we are using the live-reload to write a tutorial, it might not be.
  // Clamp to ensure we have a valid chpater index.
  const rawChapterIndex = interactionState.chapterIndex;
  const maxChapterIndex = tutorial.chapters.length - 1;
  const chapterIndex = Math.min(maxChapterIndex, Math.max(0, rawChapterIndex));
  const currentChapterElt = tutorial.chapters[chapterIndex];

  return (
    <div className="Junior-LessonContent-container">
      <WidthMonitor />
      <div className="Junior-LessonContent-HeaderBar">
        <ProgressTrail />
      </div>
      <div className="Junior-LessonContent-inner-container">
        <DivScroller containerDivRef={contentRef} />
        <div ref={contentRef} className="Junior-LessonContent abs-0000-oflow">
          <div className="content">
            <Chapter chapter={currentChapterElt} />
            <ChapterNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};
