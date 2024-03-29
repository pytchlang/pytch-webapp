import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";

import CodeEditor from "./CodeEditor";
import QuestionInputPanel from "./QuestionInputPanel";
import Stage from "./Stage";
import { StageControls, StageControlsProps } from "./StageControls";
import InfoPanel from "./InfoPanel";
import { ProjectId } from "../model/project-core";
import { equalILoadSaveStatus } from "../model/project";
import Button from "react-bootstrap/Button";
import { Link } from "./LinkWithinApp";
import VerticalResizer from "./VerticalResizer";
import { EmptyProps, assertNever } from "../utils";
import { DivSettingWindowTitle } from "./DivSettingWindowTitle";
import { useParams } from "react-router-dom";
import { CoordinateChooserBar } from "./CoordinateChooserBar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

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

const StageWithControls: React.FC<StageControlsProps> = ({ forFullScreen }) => {
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

const minStageAndInfoWidth = 440;

const IDEContents: React.FC<EmptyProps> = () => {
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
          <StageWithControls forFullScreen={true} />
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
            <StageWithControls forFullScreen={false} />
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
            <StageWithControls forFullScreen={false} />
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

const ProjectLoadFailureScreen: React.FC<EmptyProps> = () => (
  <DivSettingWindowTitle
    className="load-project-not-success failed"
    windowTitle="Pytch: Problem loading project"
  >
    <p>
      Sorry, there was a problem loading this project. Please contact the Pytch
      team if you need help.
    </p>
    <Link to="/my-projects/">
      <Button>Return to My Projects</Button>
    </Link>
  </DivSettingWindowTitle>
);

const validProjectIdString = new RegExp("^[1-9][0-9]*$");
function strictParseProjectId(s: string): ProjectId | null {
  if (!validProjectIdString.test(s)) {
    return null;
  }
  const n = parseInt(s);
  if (n.toString() !== s) {
    return null;
  }
  return n;
}

const IDE: React.FC<EmptyProps> = () => {
  const projectIdString = useParams().projectIdString;
  if (projectIdString == null) throw Error("missing projectId for IDE");

  const projectId = strictParseProjectId(projectIdString);

  // syncState is a computed property, so the default equality predicate
  // always thinks the value is different, since we get a fresh object
  // on each call.  Use the custom equality predicate to avoid needless
  // re-renders.
  const syncState = useStoreState(
    (state) => state.activeProject.syncState,
    equalILoadSaveStatus
  );

  const { ensureSyncFromStorage } = useStoreActions(
    (actions) => actions.activeProject
  );

  useEffect(() => {
    if (projectId == null) {
      return;
    }

    Sk.pytch.current_live_project =
      Sk.default_pytch_environment.current_live_project;

    ensureSyncFromStorage(projectId);

    return () => {
      Sk.pytch.sound_manager.reset();
      Sk.pytch.current_live_project =
        Sk.default_pytch_environment.current_live_project;
    };
  });

  if (projectId == null) {
    return <ProjectLoadFailureScreen />;
  }

  switch (syncState.loadState) {
    case "pending":
      return (
        <DivSettingWindowTitle
          className="load-project-not-success pending"
          windowTitle="Pytch: ...loading project..."
        >
          <p>Loading project....</p>
        </DivSettingWindowTitle>
      );
    case "failed":
      return <ProjectLoadFailureScreen />;
    case "succeeded": {
      return <IDEContents />;
    }
  }
};

export default IDE;
