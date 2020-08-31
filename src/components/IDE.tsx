import React from "react";
import { RouteComponentProps } from "@reach/router";

interface IDEProps extends RouteComponentProps {
    projectId?: string;
}

const IDE: React.FC<IDEProps> = ({projectId}) => {
    return (
        <div>
        Hello {projectId}.
        </div>
    )
}

export default IDE;
