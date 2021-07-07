import React, { useEffect } from "react";
import { SyncState } from "../model/project";
import { ITutorialSummary } from "../model/tutorials";
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
