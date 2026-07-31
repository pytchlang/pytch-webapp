import React from "react";
import {
  Outlet,
  useNavigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Welcome from "./components/Welcome";
import { ProjectList } from "./components/ProjectList";
import TutorialList from "./components/TutorialList";
import IDE from "./components/IDE";

import "./pytch.scss";
import "./project-list.scss";
import "./pytch-ide.scss";
import "./pytch-jr-ide.scss";
import "./pytch-jr-lesson.scss";
import "./help-sidebar.scss";
import "./demo-sidebar.scss";
import "./font-awesome-lib";

import { AllModals } from "./components/AllModals";
import { SingleTutorial } from "./components/SingleTutorial";
import { Link } from "./components/LinkWithinApp";
import { NavBanner } from "./components/NavBanner";
import { DemoFromZipfileURL } from "./components/DemoFromZipfileURL";
import { useStoreState, useStoreActions } from "./store";
import { useEffect } from "react";
import { assertNever, EmptyProps } from "./utils";
import { envVarOrFail, pathWithinApp } from "./env-utils";
import { ProjectFromSpecimenFlow } from "./components/ProjectFromSpecimenFlow";
import { DeliberateFailureWithBoundary } from "./components/DeliberateFailure";
import { fireAndForgetEvent } from "./model/anonymous-instrumentation";
import { StandalonePlayDemo } from "./components/StandalonePlayDemo";
import { StartTutorialAtCheckpoint } from "./components/StartTutorialAtCheckpoint";
import { useActionAsEffect } from "./components/hooks/use-action-as-effect";
import { InertCopyCodeButton } from "./components/Tutorial";
import { AppLoadingPlaceholder } from "./components/AppLoadingPlaceholder";
import { I18nBootErrorModal } from "./components/I18nBootErrorModal";
import { DemosList } from "./components/discoverable-demos-page/DemosList";
import SignUp from "./components/cloud-storage/SignUp";
import SignIn from "./components/cloud-storage/SignIn";
import Profile from "./components/cloud-storage/Profile";

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

function AppWithI18nReady() {
  const basepath = envVarOrFail("BASE_URL");

  const bootRandomChapterAccessInTutorials = useStoreActions(
    (actions) =>
      actions.tutorialCollection.bootAllowRandomChapterAccessFromQuery
  );

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
          path: "play-demo/:buildId/:demoId",
          element: <StandalonePlayDemo />,
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
          path: "demos/",
          element: <DemosList />,
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
          path: "tutorial-checkpoint/:slug/:chapterIndex",
          element: <StartTutorialAtCheckpoint />,
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
          path: "sign-up/",
          element: <SignUp />,
        },
        {
          path: "sign-in/",
          element: <SignIn />,
        },
        {
          path: "profile/",
          element: <Profile />,
        },
        {
          path: "*",
          element: <UnknownRoute />,
        },
      ],
    },
  ]);

  useEffect(() => {
    bootRandomChapterAccessInTutorials();
    fireAndForgetEvent("render", "");
  });

  return (
    <div id="App-react-root" className="App">
      <RouterProvider router={router} />
      <AllModals />
    </div>
  );
}

const kTransDefaultComponents = {
  i: <i />,
  b: <strong />,
  c: <code />,
  flatcopycode: <InertCopyCodeButton />,
};

export const App: React.FC<EmptyProps> = () => {
  const i18nStateKind = useStoreState((s) => s.i18nContextState.i18nStateKind);
  useActionAsEffect(
    (actions) => () => actions.i18nContextState.boot(kTransDefaultComponents)
  );

  switch (i18nStateKind) {
    case "not-yet-booted":
    case "pending":
      return <AppLoadingPlaceholder />;
    case "ready":
      return <AppWithI18nReady />;
    case "failed":
      return <I18nBootErrorModal />;
    default:
      return assertNever(i18nStateKind);
  }
};
