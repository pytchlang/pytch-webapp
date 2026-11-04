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
import Card from "react-bootstrap/Card";
import { assertNever } from "../utils";
import { useI18nResolvedLanguage } from "./Junior/hooks";
import { ResourceLanguageBadge } from "./ResourceLanguageBadge";
import { otherTranslations } from "../model/tutorial-languages";

const SingleTutorialError = () => {
  const { t } = useTranslation("tutorials");
  return (
    <div className="loading-error">
      <p>{t("single.error")}</p>
    </div>
  );
};

/** Return the app-relative path of the single-tutorial page for the
 * tutorial with the given `slug`, shown with the given `kind`. */
function singleTutorialPath(
  kind: SingleTutorialDisplayKind,
  slug: string
): string {
  switch (kind) {
    case "tutorial-only":
      return `/suggested-tutorial/${slug}`;
    // A single-tutorial page is not shown with "tutorial-demo-and-share"
    // (only the list of all tutorials is), but if it were, the nearest
    // match would be a "tutorial-and-demo" page.
    case "tutorial-and-demo":
    case "tutorial-demo-and-share":
      return `/suggested-tutorial-demo/${slug}`;
    default:
      return assertNever(kind);
  }
}

type OtherTranslationCardProps = {
  tutorial: ITutorialSummary;
  kind: SingleTutorialDisplayKind;
};
const OtherTranslationCard: React.FC<OtherTranslationCardProps> = ({
  tutorial,
  kind,
}) => {
  const { language, displayName } = tutorial.metadata;
  return (
    <li>
      <Card
        data-slug={tutorial.slug}
        data-tutorial-language={language}
        className="TutorialCard other-translation"
      >
        <Card.Header>
          <div className="tutorial-card-header">
            <Card.Title as="h3">
              <Link
                to={singleTutorialPath(kind, tutorial.slug)}
                lang={language}
                className="stretched-link"
              >
                {displayName}
              </Link>
            </Card.Title>
            <div className="program-kind-badge">
              <ResourceLanguageBadge language={language} alwaysShow />
            </div>
          </div>
        </Card.Header>
      </Card>
    </li>
  );
};

type OtherTranslationsProps = {
  tutorial: ITutorialSummary;
  availableSummaries: Array<ITutorialSummary>;
  kind: SingleTutorialDisplayKind;
};
const OtherTranslations: React.FC<OtherTranslationsProps> = ({
  tutorial,
  availableSummaries,
  kind,
}) => {
  const { t } = useTranslation("tutorials");
  const uiLanguage = useI18nResolvedLanguage();
  const others = otherTranslations(availableSummaries, tutorial, uiLanguage);

  if (others.length === 0) {
    return null;
  }

  return (
    <div className="other-translations">
      <h2>{t("single.other-translations.intro", { count: others.length })}</h2>
      <ul className="tutorial-list">
        {others.map((other) => (
          <OtherTranslationCard key={other.slug} tutorial={other} kind={kind} />
        ))}
      </ul>
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
      {/* The "key" ensures a fresh component, which populates its
          content afresh, when navigating to a different tutorial.
          This is needed because other-translation links navigate
          between single-tutorial pages. */}
      <TutorialSummaryDisplay
        key={requestedTutorial.slug}
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
