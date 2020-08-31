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
    const activeProject = useStoreState(state => state.activeProject);
    const { activate, deactivate } = useStoreActions(actions => ({
        activate: actions.activeProject.activate,
        deactivate: actions.activeProject.deactivate,
    }));

    if (typeof projectId === "undefined")
        throw Error("missing projectId for IDE");

    useEffect(() => {
        document.title = projectId;
        if (activeProject.loadingState === LoadingState.Succeeded
                && activeProject.project?.id !== projectId) {
            deactivate();
        }
        if (activeProject.loadingState === LoadingState.Idle) {
            activate(projectId);
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
