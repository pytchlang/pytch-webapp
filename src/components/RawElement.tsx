import React, { useEffect } from "react";
import { makeLinksOpenInNewTab } from "../utils";

/** Given an HTMLElement from another source, wrap it in a DIV.  This is
 * an unwise thing to do in general because we might not control the
 * content of that HTML.  But it is OK if we do completely control the
 * given HTML.
 *
 * Any links within the element are made to open in a new tab, so that
 * following one does not lose the user's place in (e.g.) a tutorial. */

interface RawElementProps {
  className?: string;
  element: HTMLElement | SVGElement;
}

const RawElement = ({ className, element }: RawElementProps) => {
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elt = ref.current;
    if (elt != null) {
      elt.innerHTML = "";
      elt.appendChild(element);
      makeLinksOpenInNewTab(elt);
    }
  });

  return <div className={className} ref={ref} />;
};

export default RawElement;
