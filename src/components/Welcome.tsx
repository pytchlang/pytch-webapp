import React from "react";
import { RouteComponentProps } from "@reach/router";
import NavBanner from "./NavBanner";

interface WelcomeProps extends RouteComponentProps {}

const Welcome = (props: WelcomeProps) => {
  return (
    <>
      <NavBanner />
      <p>Welcome to Pytch!</p>
    </>
  );
};

export default Welcome;
