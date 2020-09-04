import React, { useEffect, createRef } from "react";
import { RouteComponentProps } from "@reach/router"
import NavBanner from "./NavBanner";
import { ITutorialSummary } from "../model/tutorials";
import Alert from "react-bootstrap/Alert";

interface TutorialProps {
    tutorial: ITutorialSummary;
}

const Tutorial: React.FC<TutorialProps> = ({ tutorial }) => {
    const alertRef: React.RefObject<HTMLDivElement> = createRef();

    useEffect(() => {
        tutorial.contentNodes.forEach((ch) => {
        alertRef.current!.appendChild(ch);
        });
    });

    const launchTutorial = () => {
        console.log("launch:", tutorial.slug);
    }

    return (
        <li>
        <Alert
            onClick={launchTutorial}
            className="TutorialCard"
            variant="success"
            ref={alertRef}
        />
        </li>
    );
}

const TutorialList: React.FC<RouteComponentProps> = (props) => {
    const paneRef: React.RefObject<HTMLDivElement> = React.createRef();
    useEffect(() => { paneRef.current!.focus(); })
    return (
        <>
        <NavBanner/>
        <div className="TutorialList" tabIndex={-1} ref={paneRef}>
        <h1>Tutorials</h1>
        </div>
        </>
    );
}

export default TutorialList;
