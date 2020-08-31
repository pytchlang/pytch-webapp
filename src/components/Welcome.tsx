import React from "react";
import { RouteComponentProps } from "@reach/router"

interface WelcomeProps extends RouteComponentProps {}

const Welcome = (props: WelcomeProps) => {
    return (
        <>
        <p>Welcome to Pytch!</p>
        </>
    );
}

export default Welcome;
