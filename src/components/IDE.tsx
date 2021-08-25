import React, { useEffect } from "react";
import { RouteComponentProps } from "@reach/router";
import { useStoreState, useStoreActions } from "../store";

import CodeEditor from "./CodeEditor";
import QuestionInputPanel from "./QuestionInputPanel";
import Stage from "./Stage";
import StageControls from "./StageControls";
import InfoPanel from "./InfoPanel";
import { ProjectId } from "../model/projects";
import { equalILoadSaveStatus } from "../model/project";
import Button from "react-bootstrap/Button";
import { Link } from "./LinkWithinApp";
import VerticalResizer from "./VerticalResizer";
import { IDELayoutKind } from "../model/ui";
import { assertNever } from "../utils";

declare var Sk: any;

interface IDEProps extends RouteComponentProps {
  projectIdString?: string;
}

const StageWithControls = () => {
  return (
    <div className="StageWithControls">
      <StageControls />
      <div className="stage-and-text-input">
        <Stage />
        <QuestionInputPanel />
      </div>
    </div>
  );
};

const minStageAndInfoWidth = 440;

const IDEContents = (layout: IDELayoutKind, stageDisplayWidth: number) => {
  switch (layout) {
    case "wide-info-pane":
      return (
        <>
          <div className="CodeAndStage">
            <CodeEditor />
            <StageWithControls />
          </div>
          <VerticalResizer />
          <InfoPanel />
        </>
      );
    case "tall-code-editor":
      const width = Math.max(minStageAndInfoWidth, stageDisplayWidth);
      // Account for one-pixel-wide border (on each side):
      const widthStyle = { width: `${width + 2}px` };
      return (
        <>
          <CodeEditor />
          <div className="StageAndInfo" style={widthStyle}>
            <StageWithControls />
            <div className="spacer-instead-of-resizer" />
            <InfoPanel />
          </div>
        </>
      );
    default:
      assertNever(layout);
  }
};

const IDE: React.FC<IDEProps> = ({ projectIdString }) => {
  if (projectIdString == null) throw Error("missing projectId for IDE");

  const projectId: ProjectId = parseInt(projectIdString);
  // TODO: Error checking; make sure entire string is parsed
  // as integer, etc.

  const layoutKind = useStoreState((state) => state.ideLayout.kind);

  // syncState is a computed property, so the default equality predicate
  // always thinks the value is different, since we get a fresh object
  // on each call.  Use the custom equality predicate to avoid needless
  // re-renders.
  const syncState = useStoreState(
    (state) => state.activeProject.syncState,
    equalILoadSaveStatus
  );

  const stageDisplayWidth = useStoreState(
    (state) => state.ideLayout.stageDisplaySize.width
  );

  const { ensureSyncFromStorage } = useStoreActions(
    (actions) => actions.activeProject
  );

  useEffect(() => {
    Sk.pytch.current_live_project =
      Sk.default_pytch_environment.current_live_project;
    document.title = `Project ${projectId}`;

    ensureSyncFromStorage(projectId);

    return () => {
      Sk.pytch.current_live_project =
        Sk.default_pytch_environment.current_live_project;
    };
  });

  if (syncState.loadState === "failed") {
    return (
      <div className="load-project-failure">
        <p>
          Sorry, there was a problem loading this project. Please contact the
          Pytch team if you need help.
        </p>
        <Link to="/my-projects/">
          <Button>Return to My Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`ProjectIDE ${layoutKind}`}>
      {IDEContents(layoutKind, stageDisplayWidth)}
    </div>
  );
};

export default IDE;
