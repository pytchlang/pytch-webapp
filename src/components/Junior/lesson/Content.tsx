import React from "react";
import { EmptyProps } from "../../../utils";
import { useLinkedJrTutorial } from "./hooks";
import { ChapterNavigation } from "./ChapterNavigation";
import { Chapter } from "./Chapter";
import { ProgressTrail } from "./ProgressTrail";
import { HiddenAceSyntaxHighlighter } from "./commit/HiddenAceSyntaxHighlighter";

export const Content: React.FC<EmptyProps> = () => {
  const linkedTutorial = useLinkedJrTutorial();
  const tutorial = linkedTutorial.content;
  const interactionState = linkedTutorial.interactionState;

  const currentChapterElt = tutorial.chapters[interactionState.chapterIndex];

  return (
    <div className="Junior-LessonContent-container">
      <div className="Junior-LessonContent-HeaderBar">
        <ProgressTrail />
        <HiddenAceSyntaxHighlighter />
      </div>
      <div className="Junior-LessonContent-inner-container">
        <div className="Junior-LessonContent abs-0000-oflow">
          <div className="content">
            <Chapter chapter={currentChapterElt} />
            <ChapterNavigation />
          </div>
        </div>
      </div>
    </div>
  );
};
