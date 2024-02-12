import React from "react";
import { useStoreState } from "../store";
import { EmptyProps, assertNever } from "../utils";
import CodeEditor from "./CodeEditor";
import { DivSettingWindowTitle } from "./DivSettingWindowTitle";
import InfoPanel from "./InfoPanel";
import { StageWithControls } from "./StageWithControls";
import VerticalResizer from "./VerticalResizer";

const minStageAndInfoWidth = 440;

export const IDEContents_Flat: React.FC<EmptyProps> = () => {
  const stageDisplayWidth = useStoreState(
    (state) => state.ideLayout.stageDisplaySize.width
  );
  const layoutKind = useStoreState((state) => state.ideLayout.kind);
  const isFullScreen = useStoreState(
    (state) => state.ideLayout.fullScreenState.isFullScreen
  );

  const projectName = useStoreState(
    (state) => state.activeProject.project.name
  );
  const projectId = useStoreState((state) => state.activeProject.project.id);

  const kindTag = isFullScreen ? "full-screen" : layoutKind;

  const divProps = {
    className: `ProjectIDE ${kindTag}`,
    windowTitle: `Pytch: ${projectName}`,
  };

  // Full screen overrides choice of layout.
  if (isFullScreen) {
    return (
      <DivSettingWindowTitle {...divProps} data-project-id={projectId}>
        <div className="FullScreenStage">
          <StageWithControls />
        </div>
      </DivSettingWindowTitle>
    );
  }

  switch (layoutKind) {
    case "wide-info-pane":
      return (
        <DivSettingWindowTitle {...divProps} data-project-id={projectId}>
          <div className="CodeAndStage">
            <CodeEditor />
            <StageWithControls />
          </div>
          <VerticalResizer />
          <InfoPanel />
        </DivSettingWindowTitle>
      );
    case "tall-code-editor": {
      const width = Math.max(minStageAndInfoWidth, stageDisplayWidth);
      // Account for one-pixel-wide border (on each side):
      const widthStyle = { width: `${width + 2}px` };
      return (
        <DivSettingWindowTitle {...divProps} data-project-id={projectId}>
          <CodeEditor />
          <div className="StageAndInfo" style={widthStyle}>
            <StageWithControls />
            <div className="spacer-instead-of-resizer" />
            <InfoPanel />
          </div>
        </DivSettingWindowTitle>
      );
    }
    default:
      return assertNever(layoutKind);
  }
};
