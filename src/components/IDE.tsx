import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { useStoreState, useStoreActions } from "../store";

import { EmptyProps, assertNever } from "../utils";
import { ProjectId } from "../model/project-core";
import Button from "react-bootstrap/Button";
import { Link } from "./LinkWithinApp";
import { DivSettingWindowTitle } from "./DivSettingWindowTitle";
import { IDELayout } from "./IDELayout";
import { ExceptionDisplay } from "./ExceptionDisplay";

// Import order for "ace-theme-pytch" is fragile.  The code in
// ace-theme-pytch.js expects a global "ace" to exist.  These imports
// from ace-builds seem to ensure that this global exists.  A better
// understanding of how this works would be welcome.
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import "./ace-theme-pytch";
import { createFocusContext, FocusContext } from "./hooks/focus-steering";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

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
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );
  const syncLoadState = useStoreState(
    (state) => state.activeProject.latestLoadRequest.state
  );

  const loadPhase = useStoreState((state) => state.activeProject.loadPhase);

  const ensureSyncFromStorage = useStoreActions(
    (actions) => actions.activeProject.ensureSyncFromStorage
  );

  if (projectIdString == null) {
    throw Error("missing projectId for IDE");
  }

  const projectId = strictParseProjectId(projectIdString);

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

  if (loadPhase === "booting" || syncLoadState === "pending") {
    return (
      <DivSettingWindowTitle
        className="load-project-not-success pending"
        windowTitle="Pytch: ...loading project..."
      >
        <p>Loading project....</p>
      </DivSettingWindowTitle>
    );
  }

  switch (syncLoadState) {
    // Case "pending" already handled by previous "if".
    case "failed":
      return <ProjectLoadFailureScreen />;
    case "succeeded": {
      const focusContext = createFocusContext(programKind);
      return (
        <ErrorBoundary FallbackComponent={ExceptionDisplay}>
          <FocusContext.Provider value={focusContext}>
          <IDELayout />
          </FocusContext.Provider>
        </ErrorBoundary>
      );
    }
    default:
      return assertNever(syncLoadState);
  }
};

export default IDE;
