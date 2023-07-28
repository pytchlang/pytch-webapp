import React, { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { EmptyProps, assertNever } from "../utils";
import { useParams } from "react-router-dom";
import { IProjectSummary } from "../model/projects";
import { Alert, Button } from "react-bootstrap";
import { MtimeDisplay } from "./MtimeDisplay";
import { StartAfreshOption } from "../model/project-from-specimen";

type CreateNewOptionCardProps = { option: StartAfreshOption };
const CreateNewOptionCard: React.FC<CreateNewOptionCardProps> = ({
  option,
}) => {
  const enactChoice = useStoreActions(
    (actions) => actions.projectFromSpecimenFlow.enactStartAfreshChoice
  );
  const startAfresh = () => {
    enactChoice(option);
  };

  return (
    <li className="project-from-specimen-candidate start-afresh">
      <Alert className="ProjectCard" variant="success" onClick={startAfresh}>
        <div className="project-card-content">
          <div className="project-description">
            <p className="project-name">
              <em>Start again with this lesson’s code</em>
            </p>
          </div>
          <div className="dropdown-wrapper">
            {/* Click on button passes up to <Alert>'s handler. */}
            <Button>Start again</Button>
          </div>
        </div>
      </Alert>
    </li>
  );
};

type OpenExistingOptionCardProps = {
  projectSummary: IProjectSummary;
};
const OpenExistingOptionCard: React.FC<OpenExistingOptionCardProps> = ({
  projectSummary,
}) => {
  const enactChoice = useStoreActions(
    (actions) => actions.projectFromSpecimenFlow.enactExistingProjectChoice
  );
  const openExisting = () => {
    enactChoice(projectSummary);
  };

  return (
    <li className="project-from-specimen-candidate open-existing">
      <Alert className="ProjectCard" variant="success" onClick={openExisting}>
        <div className="project-card-content">
          <div className="project-description">
            <p className="project-name">{projectSummary.name}</p>
            <MtimeDisplay mtime={projectSummary.mtime} />
            {
              /*If summary is the empty string, we'll omit the <P>; this is OK.*/
              projectSummary.summary && (
                <p className="project-summary">{projectSummary.summary}</p>
              )
            }
          </div>
          <div className="dropdown-wrapper">
            <Button>Open</Button>
          </div>
        </div>
      </Alert>
    </li>
  );
};

export const ProjectFromSpecimenFlow: React.FC<EmptyProps> = () => {
  const params = useParams();

  const flowState = useStoreState(
    (state) => state.projectFromSpecimenFlow.state
  );
  const boot = useStoreActions(
    (actions) => actions.projectFromSpecimenFlow.boot
  );
  const fail = useStoreActions(
    (actions) => actions.projectFromSpecimenFlow.fail
  );

  useEffect(() => {
    console.log("ProjectFromSpecimenFlow.useEffect():", flowState.state);
    if (flowState.state === "not-yet-booted") {
      const relativePath = params["*"];
      if (relativePath == null) {
        fail("no specimen relativePath in path");
        return;
      }

      boot(relativePath);
    }
  });

  const content = (() => {
    switch (flowState.state) {
      case "not-yet-booted":
      case "fetching":
        return (
          <div className="load-project-not-success pending">
            <p>Loading...</p>
          </div>
        );

      case "creating-new":
        return (
          <div className="load-project-not-success pending">
            <p>Creating project...</p>
          </div>
        );

      case "redirecting":
        return (
          <div className="load-project-not-success pending">
            <p>Opening project....</p>
          </div>
        );

      case "failed":
        return (
          <div className="load-project-not-success failed">
            <p>Sorry, something went wrong.</p>
          </div>
        );

      default:
        assertNever(flowState);
    }
  })();
};
