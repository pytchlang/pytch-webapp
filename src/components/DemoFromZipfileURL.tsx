import { RouteComponentProps } from "@reach/router";
import React, { useEffect } from "react";
import { demoURLFromId } from "../storage/zipfile";
import { useStoreActions, useStoreState } from "../store";
import NavBanner from "./NavBanner";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import LoadingOverlay from "./LoadingOverlay";
import Link from "./LinkWithinApp";

interface DemoFromZipfileURLProps extends RouteComponentProps {
  buildId?: string;
  demoId?: string;
}

export const DemoFromZipfileURL: React.FC<DemoFromZipfileURLProps> = (
  props
) => {
  const demoState = useStoreState((state) => state.demoFromZipfileURL.state);
  const boot = useStoreActions((actions) => actions.demoFromZipfileURL.boot);
  const createProject = useStoreActions(
    (actions) => actions.demoFromZipfileURL.createProject
  );
  const fail = useStoreActions((actions) => actions.demoFromZipfileURL.fail);

  useEffect(() => {
    if (demoState.state === "booting") {
      // Router behaviour should stop this happening, but check anyway:
      if (props.buildId == null || props.demoId == null) {
        fail("buildId or demoId is null");
      } else {
        const demoURL = demoURLFromId(`${props.buildId}/${props.demoId}`);
        boot(demoURL);
      }
    }
  });

  const isCreating = demoState.state === "creating";

  const content = (() => {
    switch (demoState.state) {
      case "booting":
      case "fetching":
        return (
          <div className="loading-placeholder">
            <p>Loading...</p>
          </div>
        );
      case "proposing":
      case "creating":
        return (
          <>
            <h1>{demoState.projectDescriptor.name}</h1>
            <div className="button-bar">
              <Button
                disabled={isCreating}
                variant="outline-primary"
                onClick={() => createProject()}
              >
                Try this project
              </Button>
            </div>
          </>
        );
      case "error":
        return (
          <>
            <h1>Problem</h1>
            <p>Sorry, there was a problem fetching the project.</p>
          </>
        );
      case "idle":
        // Might see this, if the user somehow manages to get back to
        // this URL even though we've navigate()d with "replace".
        return (
          <p>
            Your project has been created. Please see{" "}
            <Link to="/my-projects/">My projects</Link>.
          </p>
        );
    }
  })();

  return (
    <>
      <NavBanner />
      <div className="TutorialList single-tutorial">
        <h1>This demo was suggested for you:</h1>
        <ul className="tutorial-list demo-only">
          <li>
            <LoadingOverlay show={isCreating}>
              <p>Creating project for demo...</p>
            </LoadingOverlay>
            <Alert className="TutorialCard demo-only" variant="success">
              {content}
            </Alert>
          </li>
        </ul>
      </div>
    </>
  );
};
