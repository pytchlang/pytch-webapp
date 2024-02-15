import React from "react";
import { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { StageControls } from "./StageControls";
import Stage from "./Stage";
import QuestionInputPanel from "./QuestionInputPanel";
import { CoordinateChooserBar } from "./CoordinateChooserBar";
import { EmptyProps } from "../utils";

const ControlsOrCoordsChooser: React.FC<EmptyProps> = () => {
  const isFullScreen = useStoreState(
    (state) => state.ideLayout.fullScreenState.isFullScreen
  );
  const coordChooserState = useStoreState(
    (state) => state.ideLayout.coordsChooser.kind
  );

  if (isFullScreen) {
    return <StageControls />;
  }

  switch (coordChooserState) {
    case "idle":
      return <StageControls />;
    case "active":
    case "active-with-copied-message":
      return <CoordinateChooserBar />;
  }
};

export const StageWithControls: React.FC<EmptyProps> = () => {
  const isFullScreen = useStoreState(
    (state) => state.ideLayout.fullScreenState.isFullScreen
  );
  const { resizeFullScreen } = useStoreActions((actions) => actions.ideLayout);
  useEffect(() => {
    const handleResize = () => isFullScreen && resizeFullScreen();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  return (
    <div className="StageWithControls">
      <ControlsOrCoordsChooser />
      <div className="stage-and-text-input">
        <Stage />
        <QuestionInputPanel />
      </div>
    </div>
  );
};
