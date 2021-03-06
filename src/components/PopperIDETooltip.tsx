import React, { useCallback, useEffect, useState } from "react";
import { useStoreState } from "../store";
import { usePopper } from "react-popper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type PopperIDETooltipProps = {
  referenceElement: HTMLElement | null;
  targetTourStage: string;
};

const PopperIDETooltip: React.FC<PopperIDETooltipProps> = ({
  referenceElement,
  targetTourStage,
  children,
}) => {
  const buttonTourProgressStage = useStoreState(
    (state) => state.ideLayout.buttonTourProgressStage
  );
  const resizeIsActive = useStoreState(
    (state) => state.ideLayout.stageVerticalResizeState != null
  );

  // Handle instant resize initiated by click on layout chooser:
  const stageDisplaySize = useStoreState(
    (state) => state.ideLayout.stageDisplaySize
  );

  const [popperElt, setPopperElt] = useState<HTMLDivElement | null>(null);
  const [arrowElt, setArrowElt] = useState<HTMLDivElement | null>(null);
  const { styles, attributes, update: rawUpdatePopper } = usePopper(
    referenceElement,
    popperElt,
    {
      modifiers: [
        { name: "arrow", options: { element: arrowElt } },
        { name: "offset", options: { offset: [0, 15] } },
      ],
    }
  );

  const updatePopper = useCallback(() => {
    rawUpdatePopper && rawUpdatePopper();
  }, [rawUpdatePopper]);

  useEffect(() => {
    if (!resizeIsActive) {
      updatePopper();
    }
  }, [updatePopper, resizeIsActive, stageDisplaySize]);

  if (buttonTourProgressStage !== targetTourStage) {
    // For testing, leave a marker in the DOM that we have made the
    // decision as to whether to display this tooltip, and we're not
    // doing so.  Otherwise, the reason Cypress doesn't find the tooltip
    // could be that it hasn't been shown yet, rather than because we
    // are never going to show it.
    return <div className="cypress-helper-hide">{targetTourStage}</div>;
  }

  const resizingExtraClass = resizeIsActive ? " hide-while-resizing" : "";

  return (
    <div
      className={`pytch-tooltip${resizingExtraClass}`}
      ref={setPopperElt}
      style={styles.popper}
      {...attributes.popper}
    >
      <div className="pytch-tooltip-content">
        <div className="icon">
          <FontAwesomeIcon className="fa-2x" icon="info-circle" />
        </div>
        {children}
      </div>
      <div
        className={`pytch-tooltip-arrow${resizingExtraClass}`}
        ref={setArrowElt}
        style={styles.arrow}
      />
    </div>
  );
};

export default PopperIDETooltip;
