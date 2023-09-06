import React from "react";
import { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { StageControls, StageControlsProps } from "./StageControls";
import Stage from "./Stage";
import QuestionInputPanel from "./QuestionInputPanel";
import { CoordinateChooserBar } from "./CoordinateChooserBar";

const ControlsOrCoordsChooser: React.FC<StageControlsProps> = ({
  forFullScreen,
}) => {
  const coordChooserState = useStoreState(
    (state) => state.ideLayout.coordsChooser.kind
  );

  if (forFullScreen) {
    return <StageControls forFullScreen={true} />;
  }

  switch (coordChooserState) {
    case "idle":
      return <StageControls forFullScreen={false} />;
    case "active":
    case "active-with-copied-message":
      return <CoordinateChooserBar />;
  }
};

export const StageWithControls: React.FC<StageControlsProps> = ({
  forFullScreen,
}) => {
  const { resizeFullScreen } = useStoreActions((actions) => actions.ideLayout);
  useEffect(() => {
    const handleResize = () => forFullScreen && resizeFullScreen();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  return (
    <div className="StageWithControls">
      <ControlsOrCoordsChooser forFullScreen={forFullScreen} />
      <div className="stage-and-text-input">
        <Stage />
        <QuestionInputPanel />
      </div>
    </div>
  );
};