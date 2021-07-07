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
