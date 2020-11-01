import React, { useEffect } from "react";
import { RouteComponentProps } from "@reach/router";
import { useStoreState, useStoreActions } from "../store";

import CodeEditor from "./CodeEditor";
import Stage from "./Stage";
import StageControls from "./StageControls";
import InfoPanel from "./InfoPanel";
import { SyncState } from "../model/project";
import { ProjectId } from "../model/projects";

declare var Sk: any;

interface IDEProps extends RouteComponentProps {
  projectIdString?: string;
}

const IDE: React.FC<IDEProps> = ({ projectIdString }) => {
  if (projectIdString == null) throw Error("missing projectId for IDE");

  const projectId: ProjectId = parseInt(projectIdString);
  // TODO: Error checking; make sure entire string is parsed
  // as integer, etc.

  const layoutKind = useStoreState((state) => state.ideLayout.kind);
  const syncState = useStoreState((state) => state.activeProject.syncState);
  const activeProjectId = useStoreState(
    (state) => state.activeProject.project?.id
  );

  const { requestSyncFromStorage, deactivate } = useStoreActions((actions) => ({
    requestSyncFromStorage: actions.activeProject.requestSyncFromStorage,
    deactivate: actions.activeProject.deactivate,
  }));

  useEffect(() => {
    Sk.pytch.current_live_project =
      Sk.default_pytch_environment.current_live_project;
    document.title = `Project ${projectId}`;

    requestSyncFromStorage(projectId);

    return () => {
      Sk.pytch.current_live_project =
        Sk.default_pytch_environment.current_live_project;
    };
  });

  return (
    <div className={`ProjectIDE ${layoutKind}`}>
      {layoutKind === "wide-info-pane" ? (
        <>
          <div className="CodeAndStage">
            <CodeEditor />
            <div className="StageWithControls">
              <StageControls />
              <Stage />
            </div>
          </div>
          <InfoPanel />
        </>
      ) : (
        <>
          <CodeEditor />
          <div className="StageAndInfo">
            <div className="StageWithControls">
              <StageControls />
              <Stage />
            </div>
            <InfoPanel />
          </div>
        </>
      )}
    </div>
  );
};

export default IDE;
