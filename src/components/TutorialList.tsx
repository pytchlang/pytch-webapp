import React, { useEffect, createRef } from "react";
import { RouteComponentProps } from "@reach/router"
import NavBanner from "./NavBanner";

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
