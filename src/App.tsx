import React from "react";
import {
  Outlet,
  useNavigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Welcome from "./components/Welcome";
import ProjectList from "./components/ProjectList";
import TutorialList from "./components/TutorialList";
import IDE from "./components/IDE";

import "./pytch.scss";
import "./project-list.scss";
import "./pytch-ide.scss";
import "./pytch-jr-ide.scss";
import "./pytch-jr-lesson.scss";
import "./help-sidebar.scss";
import "./font-awesome-lib";

import { AllModals } from "./components/AllModals";
import { SingleTutorial } from "./components/SingleTutorial";
import { Link } from "./components/LinkWithinApp";
import NavBanner from "./components/NavBanner";
import { DemoFromZipfileURL } from "./components/DemoFromZipfileURL";
import { useStoreState, useStoreActions } from "./store";
import { useEffect } from "react";
import { EmptyProps } from "./utils";
import { envVarOrFail, pathWithinApp } from "./env-utils";
import { ProjectFromSpecimenFlow } from "./components/ProjectFromSpecimenFlow";
import { DeliberateFailureWithBoundary } from "./components/DeliberateFailure";
import { fireAndForgetEvent } from "./model/anonymous-instrumentation";

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
  const basepath = envVarOrFail("BASE_URL");
  console.log(`basepath: "${basepath}"`);

  const router = createBrowserRouter([
    {
      path: basepath,
      element: <NavQueueWrapper />,
      children: [
        {
          index: true,
          element: <Welcome />,
        },
        {
          path: "my-projects/",
          element: <ProjectList />,
        },
        {
          path: "tutorials/",
          element: <TutorialList />,
        },
        {
          path: "ide/:projectIdString",
          element: <IDE />,
        },
        {
          path: "suggested-tutorial-demo/:slug",
          element: <SingleTutorial kind="tutorial-and-demo" />,
        },
        {
          path: "suggested-tutorial/:slug",
          element: <SingleTutorial kind="tutorial-only" />,
        },
        {
          path: "suggested-demo/:buildId/:demoId",
          element: <DemoFromZipfileURL />,
        },
        {
          path: "lesson/*",
          element: <ProjectFromSpecimenFlow />,
        },
        {
          path: "deliberate-failure/*",
          element: <DeliberateFailureWithBoundary />,
        },
        {
          path: "*",
          element: <UnknownRoute />,
        },
      ],
    },
  ]);

  useEffect(() => {
    fireAndForgetEvent("render", "");
  });

  return (
    <div className="App">
      <RouterProvider router={router} />
      <AllModals />
    </div>
  );
}

export default App;
