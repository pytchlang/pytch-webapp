import React from "react";
import { RouteComponentProps } from "@reach/router";

import AceEditor from "react-ace";
import Stage from "./Stage";
import StageControls from "./StageControls";
import InfoPanel from "./InfoPanel";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";

interface IDEProps extends RouteComponentProps {
    projectId?: string;
}

const IDE: React.FC<IDEProps> = ({projectId}) => {
    return (
        <div className="ProjectIDE">
            <div className="CodeAndStage">
                <AceEditor
                    mode="python"
                    theme="github"
                    value="# will come from saved project in due course"
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
