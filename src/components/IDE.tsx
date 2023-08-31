import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";

import { ProjectId } from "../model/project-core";
import { equalILoadSaveStatus } from "../model/project";
import Button from "react-bootstrap/Button";
import { Link } from "./LinkWithinApp";
import { EmptyProps } from "../utils";
import { DivSettingWindowTitle } from "./DivSettingWindowTitle";
import { useParams } from "react-router-dom";
import { IDEContents_Flat } from "./IDEContents_Flat";

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
      return <IDEContents_Flat />;
    }
  }
};

export default IDE;
