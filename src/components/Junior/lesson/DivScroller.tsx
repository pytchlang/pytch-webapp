import React, { useEffect, useState } from "react";
import { useMappedLinkedJrTutorial } from "./hooks";
import { useJrEditState } from "../hooks";

export type DivScrollerProps = {
  containerDivRef: React.RefObject<HTMLDivElement>;
};

// TODO: Compare this and the equivalent for "flat" tutorials and settle
// on one approach.
export const DivScroller: React.FC<DivScrollerProps> = (props) => {
  const chapterIndex = useMappedLinkedJrTutorial(
    (tutorial) => tutorial.interactionState.chapterIndex
  );
  const tutorialChapterScrollTop = useJrEditState(
    (s) => s.tutorialChapterScrollTop
  );

  const [lastScrolledChapIdx, setLastScrolledChapIdx] = useState(0);

  useEffect(() => {
    const containerDiv = props.containerDivRef.current;
    if (containerDiv != null) {
      if (lastScrolledChapIdx !== chapterIndex) {
        containerDiv.scrollTop = 0;
        setLastScrolledChapIdx(chapterIndex);
      } else {
        containerDiv.scrollTop = tutorialChapterScrollTop;
      }
    }
  });

  return null;
};
