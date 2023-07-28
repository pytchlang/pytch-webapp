import React, { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
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
