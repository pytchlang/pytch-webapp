import React from "react";
import {
  Outlet,
  useNavigate,
} from "react-router-dom";
import Welcome from "./components/Welcome";
import ProjectList from "./components/ProjectList";
import TutorialList from "./components/TutorialList";
import IDE from "./components/IDE";

import "./pytch.scss";
import "./project-list.scss";
import "./pytch-ide.scss";
import "./help-sidebar.scss";
import "./font-awesome-lib";

import { AllModals } from "./components/AllModals";
import { SingleTutorial } from "./components/SingleTutorial";
import Link from "./components/LinkWithinApp";
import NavBanner from "./components/NavBanner";
import { DemoFromZipfileURL } from "./components/DemoFromZipfileURL";
import { useStoreState, useStoreActions } from "./store";
import { useEffect } from "react";
import { EmptyProps } from "./utils";
import { pathWithinApp } from "./env-utils";

const UnknownRoute: React.FC<EmptyProps> = () => {
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

const NavQueueWrapper: React.FC<EmptyProps> = () => {
  const navigate = useNavigate();

  // Ensure we re-render when navigation state changes:
  useStoreState((state) => state.navigationRequestQueue.seqnum);

  const drainNavigationQueue = useStoreActions(
    (actions) => actions.navigationRequestQueue.drain
  );

  useEffect(() => {
    const maybeNavReq = drainNavigationQueue();
    if (maybeNavReq != null) {
      const path = pathWithinApp(maybeNavReq.path);
      navigate(path, maybeNavReq.opts);
    }
  });

  return <Outlet />;
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
