import React, { useEffect } from "react";
import { RouteComponentProps, navigate } from "@reach/router";
import { IDisplayedProjectSummary, LoadingState } from "../model/projects";
import { useStoreState, useStoreActions } from "../store";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import NavBanner from "./NavBanner";
import { withinApp } from "../utils";

type ProjectCardProps = {
  project: IDisplayedProjectSummary;
};

const Project: React.FC<ProjectCardProps> = ({ project }) => {
  const requestConfirmation = useStoreActions(
    (actions) => actions.userConfirmations.requestDangerousActionConfirmation
  );
  const launchRename = useStoreActions(
    (actions) => actions.userConfirmations.renameProjectInteraction.launch
  );

  const dismissButtonTour = useStoreActions(
    (actions) => actions.ideLayout.dismissButtonTour
  );
  const summary = project.summary.summary ?? "";
  const linkTarget = withinApp(`/ide/${project.summary.id}`);

  const onDelete = () => {
    requestConfirmation({
      kind: "delete-project",
      projectName: project.summary.name,
      actionIfConfirmed: {
        typePath: "projectCollection.requestDeleteProjectThenResync",
        payload: project.summary.id,
      },
    });
  };

  const onActivate = () => {
    dismissButtonTour();
    navigate(linkTarget);
  };

  const onRename = () => {
    launchRename({ id: project.summary.id, name: project.summary.name });
  };

  return (
    <li>
      <Alert onClick={onActivate} className="ProjectCard" variant="success">
        <div className="dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
          <DropdownButton title="⋮">
            <Dropdown.Item onClick={onActivate}>Open</Dropdown.Item>
            <Dropdown.Item onClick={onRename}>Rename...</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item className="danger" onClick={onDelete}>
              DELETE
            </Dropdown.Item>
          </DropdownButton>
        </div>
        <p data-project-id={project.summary.id}>
          <span className="project-name">{project.summary.name}</span>
          <span className="project-summary">{summary}</span>
        </p>
      </Alert>
    </li>
  );
};

const ProjectsLoadingIdle: React.FC = () => {
  return (
    <div className="loading-placeholder">
      <p>Loading...</p>
    </div>
  );
};

const ProjectsLoadingPending: React.FC = () => {
  return (
    <div className="loading-placeholder">
      <p>Loading...</p>
    </div>
  );
};

const ProjectsLoadingFailed: React.FC = () => {
  return <div>Project loading FAILED oh no.</div>;
};

const ProjectList: React.FC = () => {
  const available = useStoreState((state) => state.projectCollection.available);
  const launchCreate = useStoreActions(
    (actions) => actions.userConfirmations.createProjectInteraction.launch
  );
  const launchUpload = useStoreActions(
    (actions) => actions.userConfirmations.uploadZipfilesInteraction.launch
  );

  const showCreateModal = () => launchCreate();
  const showUploadModal = () => launchUpload();

  return (
    <>
      <div className="buttons">
        <Button onClick={showCreateModal}>Create a new project</Button>
        <Button onClick={showUploadModal}>Upload project</Button>
      </div>
      <ul>
        {available.map((p) => (
          <Project key={p.summary.id} project={p} />
        ))}
      </ul>
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
    document.title = "Pytch: My projects";
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
