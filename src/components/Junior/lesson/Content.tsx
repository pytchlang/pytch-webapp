import React, { UIEventHandler, createRef } from "react";
import { EmptyProps } from "../../../utils";
import { ChapterNavigation } from "./ChapterNavigation";
import { Chapter } from "./Chapter";
import { ProgressTrail } from "./ProgressTrail";
import { DivScroller } from "./DivScroller";
import { useJrEditActions } from "../hooks";
import { WidthMonitor } from "../WidthMonitor";

export const Content: React.FC<EmptyProps> = () => {
  const contentRef = createRef<HTMLDivElement>();
  const setTutorialChapterScrollTop = useJrEditActions(
    (a) => a.setTutorialChapterScrollTop
  );

  const onContentScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const contentDiv = event.currentTarget;
    setTutorialChapterScrollTop(contentDiv.scrollTop);
  };

  return (
    <div className="Junior-LessonContent-container">
      <WidthMonitor />
      <div className="Junior-LessonContent-HeaderBar">
        <ProgressTrail />
      </div>
      <div className="Junior-LessonContent-inner-container">
        <DivScroller containerDivRef={contentRef} />
        <div
          ref={contentRef}
          className="Junior-LessonContent abs-0000-oflow"
          onScroll={onContentScroll}
        >
          <div className="content">
            <Chapter />
            <ChapterNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};
