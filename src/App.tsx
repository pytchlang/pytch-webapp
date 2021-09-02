import React from "react";
import { RouteComponentProps, Router } from "@reach/router";
import Welcome from "./components/Welcome";
import ProjectList from "./components/ProjectList";
import TutorialList from "./components/TutorialList";
import IDE from "./components/IDE";

import "./pytch.scss";
import "./pytch-ide.scss";
import "./help-sidebar.scss";
import "./font-awesome-lib";

import { AllModals } from "./components/AllModals";
import { SingleTutorial } from "./components/SingleTutorial";
import Link from "./components/LinkWithinApp";
import NavBanner from "./components/NavBanner";
import { DemoFromZipfileURL } from "./components/DemoFromZipfileURL";

const UnknownRoute = (props: RouteComponentProps) => {
  return (
    <>
      <NavBanner />
      <div className="unknown-route">
        <p>Sorry, we could not find that page.</p>
        <p>
          Try returning to the <Link to="/">Pytch homepage</Link>.
        </p>
      </div>
    </>
  );
};

function App() {
  const basepath = process.env.PUBLIC_URL || "/";
  console.log(`PUBLIC_URL "${process.env.PUBLIC_URL}"; basepath "${basepath}"`);
  return (
    <>
      <Router className="App" basepath={basepath}>
        <Welcome path="/" />
        <ProjectList path="/my-projects/" />
        <TutorialList path="/tutorials/" />
        <IDE path="/ide/:projectIdString" />
        <SingleTutorial path="/suggested-tutorial/:slug" />
        <DemoFromZipfileURL path="/suggested-demo/:buildId/:demoId" />
        <UnknownRoute default />
      </Router>
      <AllModals />
    </>
  );
}

export default App;
