import React, { useEffect } from "react";
import { RouteComponentProps, navigate } from "@reach/router";
import { IProjectSummary, LoadingState } from "../model/projects";
import { useStoreState, useStoreActions } from "../store";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import NavBanner from "./NavBanner";

interface ProjectProps {
  project: IProjectSummary;
}

const Project: React.FC<ProjectProps> = ({ project }) => {
  const requestDelete = useStoreActions(
    (actions) => actions.projectCollection.requestDeleteProject
  );
  const summary = project.summary ?? "(This project has no summary)";
  const linkTarget = `/ide/${project.id}`;

  const onDelete = () => requestDelete(project.id);
  const onActivate = () => navigate(linkTarget);

  return (
    <li>
      <Alert onClick={onActivate} className="ProjectCard" variant="success">
        <div className="dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
          <DropdownButton title="⋮">
            <Dropdown.Item>Rename (not yet working)</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item className="danger" onClick={onDelete}>
              DELETE
            </Dropdown.Item>
          </DropdownButton>
        </div>
        <p>
          <span className="project-id">{project.id}</span>
          <span className="project-name">{project.name}</span>
          <span className="project-summary">{summary}</span>
        </p>
      </Alert>
    </li>
  );
};

const ProjectsLoadingIdle: React.FC = () => {
  return <div>Loading shortly...</div>;
};

const ProjectsLoadingPending: React.FC = () => {
  return <div>Loading...</div>;
};

const ProjectsLoadingFailed: React.FC = () => {
  return <div>Project loading FAILED oh no.</div>;
};

const ProjectList: React.FC = () => {
  const available = useStoreState((state) => state.projectCollection.available);
  const showModal = useStoreActions((actions) => actions.modals.show);

  const showCreateModal = () => {
    showModal("create-project");
  };

  return (
    <>
      <ul>
        {available.map((p) => (
          <Project key={p.id} project={p} />
        ))}
      </ul>
      <div className="buttons">
        <Button onClick={showCreateModal}>Create a new project</Button>
      </div>
    </>
  );
};

const componentFromState = (state: LoadingState): React.FC => {
  switch (state) {
    case LoadingState.Idle:
      return ProjectsLoadingIdle;
    case LoadingState.Pending:
      return ProjectsLoadingPending;
    case LoadingState.Succeeded:
      return ProjectList;
    case LoadingState.Failed:
      return ProjectsLoadingFailed;
  }
};

const MaybeProjectList: React.FC<RouteComponentProps> = (props) => {
  const loadSummaries = useStoreActions(
    (actions) => actions.projectCollection.loadSummaries
  );
  const deactivateProject = useStoreActions(
    (actions) => actions.activeProject.deactivate
  );
  const loadingState = useStoreState(
    (state) => state.projectCollection.loadingState
  );

  useEffect(() => {
    if (loadingState === LoadingState.Idle) {
      loadSummaries();
    }
  });

  const paneRef: React.RefObject<HTMLDivElement> = React.createRef();
  useEffect(() => {
    deactivateProject();
    paneRef.current!.focus();
  });
  const InnerComponent = componentFromState(loadingState);
  return (
    <>
      <NavBanner />
      <div className="ProjectList" tabIndex={-1} ref={paneRef}>
        <h1>My projects</h1>
        <InnerComponent />
      </div>
    </>
  );
};

export default MaybeProjectList;
