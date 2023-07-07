import React, { PropsWithChildren } from "react";
import Alert from "react-bootstrap/Alert";
import { useStoreActions, useStoreState } from "../store";
import { envVarOrFail } from "../env-utils";
import LoadingOverlay from "./LoadingOverlay";

// TODO: Replace this temporary solution with something more integrated
// with the pytch-tutorials repo.

const tutorialsDataRoot = envVarOrFail("VITE_TUTORIALS_BASE");

// Annoyingly, some tutorials call the demo screenshot "screenshot.png"
// and some "summary-screenshot.png".  We should settle on a convention,
// update the tutorials to use it, and document it.  For now, take the
// basename as another prop.
//
type TutorialMiniCardProps = PropsWithChildren<{
  title: string;
  slug: string;
  screenshotBasename: string;
}>;

const TutorialMiniCard: React.FC<TutorialMiniCardProps> = ({
  title,
  slug,
  screenshotBasename,
  children,
}) => {
  const maybeSlugCreating = useStoreState(
    (state) => state.tutorialCollection.maybeSlugCreating
  );
  const createDemoFromTutorial = useStoreActions(
    (actions) => actions.tutorialCollection.createDemoFromTutorial
  );

  const loadingSomeDemo = maybeSlugCreating != null;
  const loadingThisDemo = maybeSlugCreating === slug;

  const maybeLaunchDemo = loadingSomeDemo
    ? () => {
        /* Do nothing. */
      }
    : () => createDemoFromTutorial(slug);

  const enabledOrDisabled = loadingSomeDemo ? " disabled" : " enabled";

  return (
    <Alert className="TutorialMiniCard" variant="success">
      <h2>{title}</h2>
      <p>
        <img
          className={`screenshot${enabledOrDisabled}`}
          onClick={maybeLaunchDemo}
          src={`${tutorialsDataRoot}/${slug}/tutorial-assets/${screenshotBasename}`}
          alt={`screenshot of ${title}`}
        />
      </p>
      {children}
      <LoadingOverlay show={loadingThisDemo}>
        <p>Loading...</p>
      </LoadingOverlay>
    </Alert>
  );
};

export default TutorialMiniCard;
