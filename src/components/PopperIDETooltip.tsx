import React, { useState } from "react";
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

  const [popperElt, setPopperElt] = useState<HTMLDivElement | null>(null);
  const [arrowElt, setArrowElt] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(
    referenceElement,
    popperElt,
    {
      modifiers: [
        { name: "arrow", options: { element: arrowElt } },
        { name: "offset", options: { offset: [0, 15] } },
      ],
    }
  );

  if (buttonTourProgressStage !== targetTourStage) {
    return null;
  }

  return (
    <div
      className="pytch-tooltip"
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
        className="pytch-tooltip-arrow"
        ref={setArrowElt}
        style={styles.arrow}
      />
    </div>
  );
};

export default PopperIDETooltip;
