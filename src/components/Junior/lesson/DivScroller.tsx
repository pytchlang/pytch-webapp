import React, { useEffect } from "react";
import { scrollTopFromPageKey } from "../../../model/junior/jr-tutorial";

export type DivScrollerProps = {
  pageKey: number;
  containerDivRef: React.RefObject<HTMLDivElement>;
};

/** Remember the scroll position of each individual "page".  (In both
 * current use-cases, a "page" is a chapter either in a flat-tutorial or
 * in a per-method-lesson.)  Restore the scroll position when displaying
 * that "page", perhaps after the user checks something in a previous
 * chapter or in the help.  The map is stored in a global variable
 * outside the Easy-Peasy state; this seems to be working OK.  The map
 * is cleared when booting the IDE for a different project. */
export const DivScroller: React.FC<DivScrollerProps> = (props) => {
  // There is a flicker which is not removed by using useLayoutEffect(),
  // perhaps because the flicker is in a different component.  Accept it
  // for now.
  useEffect(() => {
    const containerDiv = props.containerDivRef.current;
    if (containerDiv != null) {
      const desiredScrollTop = scrollTopFromPageKey.get(props.pageKey) ?? 0;
      setTimeout(() => {
        containerDiv.scrollTop = desiredScrollTop;
      });

      const updateScrollTopMap = () =>
        scrollTopFromPageKey.set(props.pageKey, containerDiv.scrollTop);

      containerDiv.addEventListener("scroll", updateScrollTopMap);

      return () =>
        containerDiv.removeEventListener("scroll", updateScrollTopMap);
    }
  });

  return null;
};
