import React, { useEffect } from "react";
import { navigate, RouteComponentProps } from "@reach/router";
import { SyncState } from "../model/project";
import { ITutorialSummary } from "../model/tutorials";
import { useStoreActions, useStoreState } from "../store";
import { withinApp } from "../utils";
import Button from "react-bootstrap/Button";
import NavBanner from "./NavBanner";
import { TutorialSummaryDisplay } from "./TutorialSummaryDisplay";

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

interface SingleTutorialProps extends RouteComponentProps {
  slug?: string;
}

export const SingleTutorial: React.FC<SingleTutorialProps> = (props) => {
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

  if (props.slug == null) {
    return <SingleTutorialError />;
  }

  return (
    <>
      <NavBanner />
      <div className="TutorialList single-tutorial">
        <h1>This tutorial was suggested for you:</h1>
        <SingleTutorialContent
          availableSummaries={available}
          targetSlug={props.slug}
          syncState={syncState}
        />
        <p className="button-wrapper">
          <Button
            variant="outline-primary"
            onClick={() => {
              navigate(withinApp("/tutorials/"));
            }}
          >
            See all tutorials
          </Button>
        </p>{" "}
      </div>
    </>
  );
};
