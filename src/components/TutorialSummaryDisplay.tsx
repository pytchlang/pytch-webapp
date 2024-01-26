import React, { useEffect, createRef } from "react";
import { useStoreActions, useStoreState } from "../store";
import {
  ITutorialSummary,
  SingleTutorialDisplayKind,
} from "../model/tutorials";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import LoadingOverlay from "./LoadingOverlay";
import { PytchProgramKind } from "../model/pytch-program";
import { EditorKindThumbnail } from "./EditorKindThumbnail";

interface TutorialSummaryDisplayProps {
  tutorial: ITutorialSummary;
  kind?: SingleTutorialDisplayKind;
}

export const TutorialSummaryDisplay: React.FC<TutorialSummaryDisplayProps> = ({
  tutorial,
  kind,
}) => {
  const createProjectFromTutorial = useStoreActions(
    (actions) => actions.tutorialCollection.createProjectFromTutorial
  );
  const createDemoFromTutorial = useStoreActions(
    (actions) => actions.tutorialCollection.createDemoFromTutorial
  );
  const createShareFromTutorial = useStoreActions(
    (actions) => actions.userConfirmations.shareTutorialInteraction.launch
  );

  const alertRef: React.RefObject<HTMLDivElement> = createRef();
  const buttonsRef: React.RefObject<HTMLDivElement> = createRef();

  const maybeSlugCreating = useStoreState(
    (state) => state.tutorialCollection.maybeSlugCreating
  );

  const programKind: PytchProgramKind = tutorial.metadata.programKind ?? "flat";

  const loadingSomeTutorial = maybeSlugCreating != null;
  const loadingThisTutorial = maybeSlugCreating === tutorial.slug;

  useEffect(() => {
    let elt = alertRef.current;
    const buttonsElt = buttonsRef.current;
    if (elt == null || buttonsElt == null) return;

    if (elt.hasAttribute("data-populated")) return;
    for (const ch of tutorial.contentNodes) {
      elt.insertBefore(ch, buttonsElt);
    }
    elt.setAttribute("data-populated", "yes");
  });

  const launchTutorial = () => {
    createProjectFromTutorial(tutorial.slug);
  };

  const launchDemo = () => {
    createDemoFromTutorial(tutorial.slug);
  };

  const h1s = tutorial.contentNodes.filter((n) => n.nodeName === "H1");
  const maybeDisplayName = h1s.length === 0 ? null : h1s[0].textContent;
  const displayName = maybeDisplayName ?? "Unknown project";

  const launchShare = () => {
    const shareInfo = { slug: tutorial.slug, displayName };
    createShareFromTutorial(shareInfo);
  };

  const showDemoButton =
    kind === "tutorial-and-demo" || kind === "tutorial-demo-and-share";
  const showShareButton = kind === "tutorial-demo-and-share";

  return (
    <li>
      <LoadingOverlay show={loadingThisTutorial}>
        <p>Creating project for tutorial...</p>
      </LoadingOverlay>
      <Alert
        data-slug={tutorial.slug}
        className="TutorialCard"
        variant="success"
        ref={alertRef}
      >
        {tutorial.metadata.difficulty && (
          <div className="info-badges">
            {/* The className is not used in CSS but is used in e2e tests. */}
            <p className="tag-difficulty">{tutorial.metadata.difficulty}</p>
            <EditorKindThumbnail programKind={programKind} size="sm" />
          </div>
        )}
        <div className="button-bar" ref={buttonsRef}>
          {showDemoButton && (
            <Button
              title="Try this project"
              disabled={loadingSomeTutorial}
              variant="outline-primary"
              onClick={launchDemo}
            >
              Demo
            </Button>
          )}
          <Button
            title="Learn how to make this project"
            disabled={loadingSomeTutorial}
            variant="outline-primary"
            onClick={launchTutorial}
          >
            Tutorial
          </Button>
          {showShareButton && (
            <Button
              title="Share this project"
              disabled={loadingSomeTutorial}
              variant="outline-primary"
              onClick={launchShare}
            >
              Share
            </Button>
          )}
        </div>
      </Alert>
    </li>
  );
};
