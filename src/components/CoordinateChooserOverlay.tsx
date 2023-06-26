import React from "react";
import { createRef, useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { EmptyProps } from "../utils";

export const CoordinateChooserOverlay: React.FC<EmptyProps> = () => {
  const chooserState = useStoreState(
    (state) => state.ideLayout.coordsChooser.kind
  );

  const setState = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.setStateKind
  );
  const dismissChooserBar = () => setState("idle");

  const copyAction = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.maybeCopyCoords
  );
  const doCopy = () => copyAction();

  const divRef = createRef<HTMLDivElement>();

  const handleKeyDown: React.KeyboardEventHandler = (event) => {
    if (event.key === "Escape") {
      dismissChooserBar();
      event.preventDefault();
    }
  };

  useEffect(() => {
    divRef.current?.focus();
  });

  if (chooserState === "idle") {
    return null;
  }

  return (
    <>
      <div className="CoordinateChooserSubOverlay abs-0000" />
      <div
        ref={divRef}
        className="CoordinateChooserOverlay abs-0000"
        onKeyDown={handleKeyDown}
        onClick={doCopy}
        tabIndex={-1}
      >
        {/* The rather unholy mix of DIVs and CSS (both inline and SCSS-driven)
            could probably be improved. */}
        <div className="grid">
          <div className="v-centre abs-0000">
            <div className="x-axis" />
          </div>
          <div className="v-centre abs-0000">
            <div className="arrow" />
          </div>
          <div className="h-centre abs-0000">
            <div className="y-axis" />
          </div>
          <div className="h-centre abs-0000">
            <div className="arrow" />
          </div>
          <div className="h-split x-ticks abs-0000">
            <div className="v-split">
              <div></div>
              <div>−240</div>
            </div>
            <div className="v-split" style={{ justifyItems: "end" }}>
              <div style={{ alignSelf: "end" }}>x</div>
              <div>240</div>
            </div>
          </div>
          <div className="v-split y-ticks abs-0000">
            <div className="h-split">
              <div style={{ justifySelf: "end" }}>180</div>
              <div className="pad">y</div>
            </div>
            <div className="h-split">
              <div style={{ justifySelf: "end", alignSelf: "end" }}>−180</div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
