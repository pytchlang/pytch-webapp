import React, { useEffect } from "react";
import { SyncState } from "../model/project";
import {
  ITutorialSummary,
  SingleTutorialDisplayKind,
} from "../model/tutorials";
import { useStoreActions, useStoreState } from "../store";
import Button from "react-bootstrap/Button";
import { NavBanner } from "./NavBanner";
import { TutorialSummaryDisplay } from "./TutorialSummaryDisplay";
import { useParams } from "react-router-dom";
import { Link } from "./LinkWithinApp";
import { ContentLoadingSpinner } from "./Junior/ContentLoadingSpinner";
import { useTranslation } from "react-i18next";

const SingleTutorialError = () => {
  const { t } = useTranslation("tutorials");
  return (
    <div className="loading-error">
      <p>{t("single.error")}</p>
    </div>
  );
};

interface SingleTutorialContentProps {
  targetSlug: string;
  syncState: SyncState;
  availableSummaries: Array<ITutorialSummary>;
  targetKind: SingleTutorialDisplayKind;
}

const SingleTutorialContent: React.FC<SingleTutorialContentProps> = (props) => {
  switch (props.syncState) {
    case SyncState.Syncd:
      // Fall through into rest of function for usual case.
      break;

    case SyncState.SyncNotStarted:
    case SyncState.SyncingFromBackEnd:
      return (
        <div className="loading-placeholder py-5">
          <ContentLoadingSpinner />
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
      <TutorialSummaryDisplay
        tutorial={requestedTutorial}
        kind={props.targetKind}
      />
    </ul>
  );
};

type SingleTutorialProps = {
  kind: SingleTutorialDisplayKind;
};

export const SingleTutorial: React.FC<SingleTutorialProps> = ({ kind }) => {
  const { t } = useTranslation("tutorials");
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
        <h1>{t("single.title")}</h1>
        <SingleTutorialContent
          availableSummaries={available}
          targetSlug={params.slug}
          syncState={syncState}
          targetKind={kind}
        />
        <p className="button-wrapper">
          <Link to="/tutorials/">
            <Button variant="outline-primary">
              {t("single.button.see-all")}
            </Button>
          </Link>
        </p>
      </div>
    </>
  );
};
