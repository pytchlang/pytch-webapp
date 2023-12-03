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

  // In normal use, the chapter index should always be in range, but if
  // we are using the live-reload to write a tutorial, it might not be.
  // Clamp to ensure we have a valid chpater index.
  const rawChapterIndex = interactionState.chapterIndex;
  const maxChapterIndex = tutorial.chapters.length - 1;
  const chapterIndex = Math.min(maxChapterIndex, Math.max(0, rawChapterIndex));
  const currentChapterElt = tutorial.chapters[chapterIndex];

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
