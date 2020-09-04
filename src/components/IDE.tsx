import React, { useEffect } from "react";
import { RouteComponentProps } from "@reach/router";
import { useStoreState, useStoreActions } from "../store"

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
    if (projectIdString == null)
        throw Error("missing projectId for IDE");

    const projectId: ProjectId = parseInt(projectIdString);
    // TODO: Error checking; make sure entire string is parsed
    // as integer, etc.

    const codeSyncState = useStoreState(state => state.activeProject.codeSyncState);
    const activeProjectId = useStoreState(state => state.activeProject.project?.id);

    const {
        requestSyncFromStorage,
        deactivate,
     } = useStoreActions(actions => ({
        requestSyncFromStorage: actions.activeProject.requestSyncFromStorage,
        deactivate: actions.activeProject.deactivate,
    }));

    useEffect(() => {
        Sk.pytch.current_live_project = Sk.default_pytch_environment.current_live_project;
        document.title = `Project ${projectId}`;

        if (codeSyncState === SyncState.Syncd) {
            if (activeProjectId == null) {
                throw Error("project claims to be syncd but is null");
            }
            if (activeProjectId !== projectId) {
                deactivate();
            }
        }
        if (codeSyncState === SyncState.NoProject) {
            // TODO: Can we do this without re-rendering whole thing when adding an asset?
            // if (activeProject.assetsSyncState !== SyncState.NoProject) {
            //   throw Error("no project wrt code but assets disagree?");
            // }
            requestSyncFromStorage(projectId);
        }

        return () => {
            Sk.pytch.current_live_project = Sk.default_pytch_environment.current_live_project;
        };
    });

    return (
        <div className="ProjectIDE">
            <div className="CodeAndStage">
                <CodeEditor/>
                <div className="StageWithControls">
                    <StageControls/>
                    <Stage/>
                </div>
            </div>
            <InfoPanel/>
        </div>
    )
}

export default IDE;
