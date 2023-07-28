import React, { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { Alert, Button } from "react-bootstrap";
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
