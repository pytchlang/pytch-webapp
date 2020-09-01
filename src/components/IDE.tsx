import React, { useEffect } from "react";
import { RouteComponentProps } from "@reach/router";
import { useStoreState, useStoreActions } from "../store"

import CodeEditor from "./CodeEditor";
import Stage from "./Stage";
import StageControls from "./StageControls";
import InfoPanel from "./InfoPanel";
import { SyncState } from "../model/project";

interface IDEProps extends RouteComponentProps {
    projectId?: string;
}

const IDE: React.FC<IDEProps> = ({projectId}) => {
    const { activeProject } = useStoreState(state => ({
        activeProject: state.activeProject,
    }));
    const {
        requestSyncFromStorage,
        deactivate,
     } = useStoreActions(actions => ({
        requestSyncFromStorage: actions.activeProject.requestSyncFromStorage,
        deactivate: actions.activeProject.deactivate,
    }));

    if (typeof projectId === "undefined")
        throw Error("missing projectId for IDE");

    useEffect(() => {
        document.title = projectId;

        if (activeProject.codeSyncState === SyncState.Syncd) {
            if (activeProject.project == null) {
                throw Error("project claims to be syncd but is null");
            }
            if (activeProject.project.id !== projectId) {
                deactivate();
            }
        }
        if (activeProject.codeSyncState === SyncState.NoProject) {
            if (activeProject.assetsSyncState !== SyncState.NoProject) {
                throw Error("no project wrt code but assets disagree?");
            }

            requestSyncFromStorage(projectId);
        }
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
