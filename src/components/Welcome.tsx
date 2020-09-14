import React from "react";
import { RouteComponentProps } from "@reach/router";
import NavBanner from "./NavBanner";
import Button from "react-bootstrap/Button";
import { Link } from "./LinkWithinApp";

const Welcome: React.FC<RouteComponentProps> = () => {
  return (
    <>
      <NavBanner />
      <div className="welcome-text">
        <h1>Get started!</h1>
        <div className="nav-buttons">
          <Link to="/tutorials/">
            <Button>Learn about Pytch from a tutorial</Button>
          </Link>
          <Link to="/my-projects/">
            <Button>Work on one of your projects</Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Welcome;
