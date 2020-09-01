import React, { useEffect } from "react";
import { RouteComponentProps } from "@reach/router";
import { useStoreState, useStoreActions } from "../store"

import AceEditor from "react-ace";
import Stage from "./Stage";
import StageControls from "./StageControls";
import InfoPanel from "./InfoPanel";
import { LoadingState } from "../model/projects";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";

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

    const text = (activeProject.loadingState === LoadingState.Succeeded
        ? activeProject.project!.codeText
        : "# Loading...\n");

    return (
        <div className="ProjectIDE">
            <div className="CodeAndStage">
                <AceEditor
                    mode="python"
                    theme="github"
                    value={text}
                    name="editor"
                    fontSize={16}
                    width="auto"
                    height="auto"
                    // TODO: onChange={setCodeText}
                />
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
