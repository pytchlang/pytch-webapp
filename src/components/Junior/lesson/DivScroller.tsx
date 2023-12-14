import React, { useEffect, useState } from "react";
import { useLinkedJrTutorial } from "./hooks";

export type DivScrollerProps = {
  containerDivRef: React.RefObject<HTMLDivElement>;
};

// TODO: Compare this and the equivalent for "flat" tutorials and settle
// on one approach.
export const DivScroller: React.FC<DivScrollerProps> = (props) => {
  const linkedTutorial = useLinkedJrTutorial();
  const chapterIndex = linkedTutorial.interactionState.chapterIndex;
  const [lastScrolledChapIdx, setLastScrolledChapIdx] = useState(0);

  useEffect(() => {
    const containerDiv = props.containerDivRef.current;
    if (containerDiv != null && lastScrolledChapIdx !== chapterIndex) {
      containerDiv.scrollTo(0, 0);
      setLastScrolledChapIdx(chapterIndex);
    }
  });

  return null;
};
