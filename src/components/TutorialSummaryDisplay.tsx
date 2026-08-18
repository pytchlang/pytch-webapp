import React, { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import {
  ITutorialSummary,
  SingleTutorialDisplayKind,
} from "../model/tutorials";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { LoadingOverlay } from "./LoadingOverlay";
import { PytchProgramKind } from "../model/pytch-program-types";
import { EditorKindThumbnail } from "./EditorKindThumbnail";
import { useRunFlow } from "../model";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface TutorialSummaryDisplayProps {
  tutorial: ITutorialSummary;
  kind: SingleTutorialDisplayKind;
}

export const TutorialSummaryDisplay: React.FC<TutorialSummaryDisplayProps> = ({
  tutorial,
  kind,
}) => {
  const { t } = useTranslation("tutorials");

  const createProjectFromTutorial = useStoreActions(
    (actions) => actions.tutorialCollection.createProjectFromTutorial
  );
  const createDemoFromTutorial = useStoreActions(
    (actions) => actions.tutorialCollection.createDemoFromTutorial
  );

  const runShareTutorial = useRunFlow((f) => f.shareTutorialFlow);

  const cardRef = React.useRef<HTMLDivElement>(null);

  const maybeSlugCreating = useStoreState(
    (state) => state.tutorialCollection.maybeSlugCreating
  );

  const programKind: PytchProgramKind = tutorial.metadata.programKind ?? "flat";

  const loadingSomeTutorial = maybeSlugCreating != null;
  const loadingThisTutorial = maybeSlugCreating === tutorial.slug;

  useEffect(() => {
    let elt = cardRef.current;
    if (elt == null) return;

    if (elt.hasAttribute("data-populated")) return;
    for (const ch of tutorial.contentNodes) {
      elt.appendChild(ch);
    }
    elt.setAttribute("data-populated", "yes");
  });

  const launchTutorial = () => {
    createProjectFromTutorial({ slug: tutorial.slug, chapterIndex: 0 });
  };

  const launchDemo = () => {
    createDemoFromTutorial(tutorial.slug);
  };

  const displayName = tutorial.metadata.displayName;

  const launchShare = () => {
    const shareInfo = { slug: tutorial.slug, displayName, programKind };
    runShareTutorial(shareInfo);
  };

  const showDemoButton =
    kind === "tutorial-and-demo" || kind === "tutorial-demo-and-share";
  const showShareButton = kind === "tutorial-demo-and-share";

  // The className is not used in CSS but is used in e2e tests.
  const maybeDifficultyBadge = tutorial.metadata.difficulty && (
    <p className="tag-difficulty m-0">
      <span className="d-inline-block">{tutorial.metadata.difficulty}</span>
    </p>
  );

  const kindBadge = <EditorKindThumbnail programKind={programKind} size="sm" />;

  const tButton = (
    kind: "demo" | "tutorial" | "share",
    usage: "label" | "title"
  ) => t(`list.button.${kind}.${usage}`);

  return (
    <li>
      <LoadingOverlay show={loadingThisTutorial} />
      <Card data-slug={tutorial.slug} className="TutorialCard">
        <Card.Header>
          <div className="tutorial-card-header">
            <div className="difficulty-badge">{maybeDifficultyBadge}</div>
            <Card.Title as="h3">{displayName}</Card.Title>
            <div className="program-kind-badge">{kindBadge}</div>
          </div>
        </Card.Header>
        <Card.Body ref={cardRef} />
        <Card.Footer>
          <div className="button-bar">
            {showDemoButton && (
              <Button
                title={tButton("demo", "title")}
                disabled={loadingSomeTutorial}
                variant="outline-primary"
                onClick={launchDemo}
              >
                {tButton("demo", "label")}
              </Button>
            )}
            <Button
              title={tButton("tutorial", "title")}
              disabled={loadingSomeTutorial}
              variant="outline-primary"
              onClick={launchTutorial}
            >
              {tButton("tutorial", "label")}
            </Button>
            {showShareButton && (
              <Button
                title={tButton("share", "title")}
                disabled={loadingSomeTutorial}
                variant="outline-primary"
                onClick={launchShare}
              >
                {tButton("share", "label")}
              </Button>
            )}
          </div>
        </Card.Footer>
      </Card>
    </li>
  );
};
