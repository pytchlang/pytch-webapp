import React from "react";
import { RouteComponentProps } from "@reach/router";
import NavBanner from "./NavBanner";

const Welcome: React.FC<RouteComponentProps> = () => {
  return (
    <>
      <NavBanner />
      <p>Welcome to Pytch!</p>
    </>
  );
};

export default Welcome;
