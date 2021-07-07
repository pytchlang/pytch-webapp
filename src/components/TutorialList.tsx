import React, { useEffect, createRef } from "react";
import { RouteComponentProps } from "@reach/router";
import NavBanner from "./NavBanner";
import { useStoreActions, useStoreState } from "../store";
import { SyncState } from "../model/project";
import { ITutorialSummary } from "../model/tutorials";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import LoadingOverlay from "./LoadingOverlay";

interface TutorialProps {
  tutorial: ITutorialSummary;
}

const TutorialSummaryDisplay: React.FC<TutorialProps> = ({ tutorial }) => {
  const createProjectFromTutorial = useStoreActions(
    (actions) => actions.tutorialCollection.createProjectFromTutorial
  );
  const createDemoFromTutorial = useStoreActions(
    (actions) => actions.tutorialCollection.createDemoFromTutorial
  );
  const alertRef: React.RefObject<HTMLDivElement> = createRef();
  const buttonsRef: React.RefObject<HTMLDivElement> = createRef();

  const maybeSlugCreating = useStoreState(
    (state) => state.tutorialCollection.maybeSlugCreating
  );

  const loadingSomeTutorial = maybeSlugCreating != null;
  const loadingThisTutorial = maybeSlugCreating === tutorial.slug;

  useEffect(() => {
    tutorial.contentNodes.forEach((ch) => {
      alertRef.current!.insertBefore(ch, buttonsRef.current!);
    });
  });

  const launchTutorial = () => {
    createProjectFromTutorial(tutorial.slug);
  };

  const launchDemo = (evt: any) => {
    createDemoFromTutorial(tutorial.slug);
  };

  return (
    <li>
      <LoadingOverlay show={loadingThisTutorial}>
        <p>Creating project for tutorial...</p>
      </LoadingOverlay>
      <Alert className="TutorialCard" variant="success" ref={alertRef}>
        <div className="button-bar" ref={buttonsRef}>
          <Button
            disabled={loadingSomeTutorial}
            variant="outline-primary"
            onClick={launchDemo}
          >
            Try this project
          </Button>
          <Button
            disabled={loadingSomeTutorial}
            variant="outline-primary"
            onClick={launchTutorial}
          >
            Learn how to make this project
          </Button>
        </div>
      </Alert>
    </li>
  );
};

const LoadingTutorialsPlaceholder = () => {
  const syncState = useStoreState(
    (state) => state.tutorialCollection.syncState
  );

  if (syncState === SyncState.Syncd) return null;

  return (
    <div className="loading-placeholder">
      <p>Loading...</p>
    </div>
  );
};

const TutorialList: React.FC<RouteComponentProps> = (props) => {
  const loadSummaries = useStoreActions(
    (actions) => actions.tutorialCollection.loadSummaries
  );
  const syncState = useStoreState(
    (state) => state.tutorialCollection.syncState
  );
  const available = useStoreState(
    (state) => state.tutorialCollection.available
  );

  useEffect(() => {
    if (syncState === SyncState.SyncNotStarted) {
      loadSummaries();
    }
  });

  const paneRef: React.RefObject<HTMLDivElement> = React.createRef();
  useEffect(() => {
    paneRef.current!.focus();
  });
  return (
    <>
      <NavBanner />
      <div className="TutorialList" tabIndex={-1} ref={paneRef}>
        <h1>Tutorials</h1>
        <LoadingTutorialsPlaceholder />
        <ul className="tutorial-list">
          {available.map((t) => (
            <TutorialSummaryDisplay key={t.slug} tutorial={t} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default TutorialList;
