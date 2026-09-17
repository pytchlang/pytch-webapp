import React from "react";
import { EmptyProps } from "../../../utils";
import { ChapterNavigation } from "./ChapterNavigation";
import { Chapter } from "./Chapter";
import { ProgressTrail } from "./ProgressTrail";
import { DivScroller } from "./DivScroller";
import { WidthMonitor } from "../WidthMonitor";
import { useMappedLinkedJrTutorial } from "./hooks";
import { MaybeSeizeFocus } from "../../MaybeSeizeFocus";

export const Content: React.FC<EmptyProps> = () => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const chapterIdx = useMappedLinkedJrTutorial(
    (tutorial) => tutorial.interactionState.chapterIndex
  );

  // TODO: This "1100" for WidthMonitor is a bit of a magic number; it
  // came from the min width of the first two columns (512 each) then
  // adding a bit.  Do something more sensible for this.

  return (
    <div className="Junior-LessonContent-container">
      <WidthMonitor nonStageWd={1100} />
      <div className="Junior-LessonContent-HeaderBar">
        <ProgressTrail.PerMethod />
      </div>
      <div className="Junior-LessonContent-inner-container">
        <DivScroller pageKey={chapterIdx} containerDivRef={contentRef} />
        <div
          ref={contentRef}
          className="Junior-LessonContent gfs__help-content abs-0000-oflow"
          tabIndex={0}
        >
          <MaybeSeizeFocus targetRef={contentRef} />
          <div className="content">
            <Chapter />
            <ChapterNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};
