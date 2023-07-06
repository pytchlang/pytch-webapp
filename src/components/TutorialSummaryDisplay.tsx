import React, { useEffect, createRef } from "react";
import { useStoreActions, useStoreState } from "../store";
import { ITutorialSummary } from "../model/tutorials";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import LoadingOverlay from "./LoadingOverlay";

interface TutorialSummaryDisplayProps {
  tutorial: ITutorialSummary;
}

export const TutorialSummaryDisplay: React.FC<TutorialSummaryDisplayProps> = ({
  tutorial,
}) => {
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

  return (
    <li>
      <LoadingOverlay show={loadingThisTutorial}>
        <p>Creating project for tutorial...</p>
      </LoadingOverlay>
      <Alert className="TutorialCard" variant="success" ref={alertRef}>
        {tutorial.metadata.difficulty && (
          <div className="tag-difficulty">{tutorial.metadata.difficulty}</div>
        )}
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
