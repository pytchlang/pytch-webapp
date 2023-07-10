import React, { useEffect } from "react";
import { SyncState } from "../model/project";
import { ITutorialSummary } from "../model/tutorials";
import { useStoreActions, useStoreState } from "../store";
import Button from "react-bootstrap/Button";
import NavBanner from "./NavBanner";
import { TutorialSummaryDisplay } from "./TutorialSummaryDisplay";
import { useParams } from "react-router-dom";
import { EmptyProps } from "../utils";
import { Link } from "./LinkWithinApp";

const SingleTutorialError = () => (
  <div className="loading-error">
    <p>Sorry, there was a problem finding the suggested tutorial.</p>
  </div>
);

interface SingleTutorialContentProps {
  targetSlug: string;
  syncState: SyncState;
  availableSummaries: Array<ITutorialSummary>;
}

const SingleTutorialContent: React.FC<SingleTutorialContentProps> = (props) => {
  switch (props.syncState) {
    case SyncState.Syncd:
      // Fall through into rest of function for usual case.
      break;

    case SyncState.SyncNotStarted:
    case SyncState.SyncingFromBackEnd:
      return (
        <div className="loading-placeholder">
          <p>Loading...</p>
        </div>
      );

    case SyncState.Error:
    case SyncState.SyncingToBackEnd:
    default:
      return <SingleTutorialError />;
  }

  const requestedTutorial = props.availableSummaries.find(
    (t) => t.slug === props.targetSlug
  );

  if (requestedTutorial == null) {
    return <SingleTutorialError />;
  }

  return (
    <ul className="tutorial-list">
      <TutorialSummaryDisplay tutorial={requestedTutorial} />
    </ul>
  );
};

export const SingleTutorial: React.FC<EmptyProps> = () => {
  const params = useParams();

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

  if (params.slug == null) {
    return <SingleTutorialError />;
  }

  return (
    <>
      <NavBanner />
      <div className="TutorialList single-tutorial">
        <h1>This tutorial was suggested for you:</h1>
        <SingleTutorialContent
          availableSummaries={available}
          targetSlug={params.slug}
          syncState={syncState}
        />
        <p className="button-wrapper">
          <Link to="/tutorials/">
            <Button variant="outline-primary">See all tutorials</Button>
          </Link>
        </p>{" "}
      </div>
    </>
  );
};
