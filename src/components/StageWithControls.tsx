import React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("ide");
  const { resizeFullScreen } = useStoreActions((actions) => actions.ideLayout);
  useEffect(() => {
    const handleResize = () => isFullScreen && resizeFullScreen();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  const ariaLabel = t("stage-with-controls.aria-label");
  const layoutStyle = useStoreState((state) => state.ideLayout.layoutStyle);

  return (
    <div className="StageWithControls">
      {(layoutStyle === "split-screen" || isFullScreen) && (
        <ControlsOrCoordsChooser />
      )}
      <section className="stage-and-text-input" aria-label={ariaLabel}>
        <Stage />
        <QuestionInputPanel />
      </section>
    </div>
  );
};
