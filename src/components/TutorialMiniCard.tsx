import React from "react";
import Alert from "react-bootstrap/Alert";
import { useStoreActions, useStoreState } from "../store";
import { failIfNull } from "../utils";

// TODO: Replace this temporary solution with something more integrated
// with the pytch-tutorials repo.

const tutorialsDataRoot = failIfNull(
  process.env.REACT_APP_TUTORIALS_BASE,
  "must set REACT_APP_TUTORIALS_BASE env.var"
);

// Annoyingly, some tutorials call the demo screenshot "screenshot.png"
// and some "summary-screenshot.png".  We should settle on a convention,
// update the tutorials to use it, and document it.  For now, take the
// basename as another prop.
//
type TutorialMiniCardProps = {
  title: string;
  slug: string;
  screenshotBasename: string;
};

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

  const loadingThisDemo = maybeSlugCreating === slug;

  const launchDemo = () => createDemoFromTutorial(slug);

  const maybeLoadingDiv = loadingThisDemo ? (
    <div className="loading-in-progress">
      <div className="background"></div>
      <p>Loading...</p>
    </div>
  ) : null;

  return (
    <Alert className="TutorialMiniCard" variant="success">
      <h2>{title}</h2>
      <p>
        <img
          className="screenshot"
          onClick={launchDemo}
          src={`${tutorialsDataRoot}/${slug}/tutorial-assets/${screenshotBasename}`}
          alt={`screenshot of ${title}`}
        />
      </p>
      {children}
      {maybeLoadingDiv}
    </Alert>
  );
};

export default TutorialMiniCard;
