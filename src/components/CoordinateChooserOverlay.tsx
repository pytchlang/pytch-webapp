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
      </div>
    </>
  );
};
