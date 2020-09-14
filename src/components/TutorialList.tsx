import React, { useEffect, createRef } from "react";
import { RouteComponentProps } from "@reach/router";
import NavBanner from "./NavBanner";
import { useStoreActions, useStoreState } from "../store";
import { SyncState } from "../model/project";
import { ITutorialSummary } from "../model/tutorials";
import Alert from "react-bootstrap/Alert";

interface CreatingProjectOverlayProps {
  show: boolean;
}

const CreatingProjectOverlay = ({ show }: CreatingProjectOverlayProps) => {
  return show ? (
    <div className="tutorial-loading-overlay">
      <p>Creating project for tutorial...</p>
    </div>
  ) : null;
};

interface TutorialProps {
  tutorial: ITutorialSummary;
}

const Tutorial: React.FC<TutorialProps> = ({ tutorial }) => {
  const createProjectFromTutorial = useStoreActions(
    (actions) => actions.tutorialCollection.createProjectFromTutorial
  );
  const alertRef: React.RefObject<HTMLDivElement> = createRef();

  const isLoading = useStoreState(
    (state) => state.tutorialCollection.maybeSlugCreating === tutorial.slug
  );

  useEffect(() => {
    tutorial.contentNodes.forEach((ch) => {
      alertRef.current!.appendChild(ch);
    });
  });

  const launchTutorial = () => {
    createProjectFromTutorial(tutorial.slug);
  };

  return (
    <li>
      <CreatingProjectOverlay show={isLoading} />
      <Alert
        onClick={launchTutorial}
        className="TutorialCard"
        variant="success"
        ref={alertRef}
      />
    </li>
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
        <ul>
          {available.map((t) => (
            <Tutorial key={t.slug} tutorial={t} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default TutorialList;
