import { RouteComponentProps } from "@reach/router";
import React, { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import Button from "react-bootstrap/Button";
import Link from "./LinkWithinApp";

interface DemoFromZipfileURLProps extends RouteComponentProps {
  buildId?: string;
  demoId?: string;
}

export const DemoFromZipfileURL: React.FC<DemoFromZipfileURLProps> = (
  props
) => {
  const demoState = useStoreState((state) => state.demoFromZipfileURL);
  const createProject = useStoreActions(
    (actions) => actions.demoFromZipfileURL.createProject
  );

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
};
