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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ProjectCardProps = {
  project: IDisplayedProjectSummary;
  anySelected: boolean;
};

const Project: React.FC<ProjectCardProps> = ({ project, anySelected }) => {
  const requestConfirmation = useStoreActions(
    (actions) => actions.userConfirmations.requestDangerousActionConfirmation
  );
  const launchRename = useStoreActions(
    (actions) => actions.userConfirmations.renameProjectInteraction.launch
  );
  const toggleSelected = useStoreActions(
    (actions) => actions.projectCollection.toggleProjectSelected
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
        typePath: "projectCollection.requestDeleteManyProjectsThenResync",
        payload: [project.summary.id],
      },
    });
  };

  const onActivate = () => {
    if (anySelected) {
      toggleSelected(project.summary.id);
    } else {
      dismissButtonTour();
      navigate(linkTarget);
    }
  };

  const onToggleIsSelected = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelected(project.summary.id);
  };

  const onRename = () => {
    launchRename({ id: project.summary.id, name: project.summary.name });
  };

  const maybeSelectedExtraClass = project.isSelected ? " selected" : "";

  return (
    <li>
      <Alert onClick={onActivate} className="ProjectCard" variant="success">
        <div
          className="project-card-content"
          data-project-id={project.summary.id}
        >
          <span
            className={`selection-check${maybeSelectedExtraClass}`}
            onClick={onToggleIsSelected}
          >
            <FontAwesomeIcon className="fa-lg" icon="check-circle" />
          </span>
          <div className="project-description">
            <span className="project-name">{project.summary.name}</span>
            <span className="project-summary">{summary}</span>
          </div>
          <div
            className="dropdown-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownButton title="⋮">
              <Dropdown.Item onClick={onActivate}>Open</Dropdown.Item>
              <Dropdown.Item onClick={onRename}>Rename...</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item className="danger" onClick={onDelete}>
                DELETE
              </Dropdown.Item>
            </DropdownButton>
          </div>
        </div>
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

const ImportFromGoogleButton: React.FC<{}> = () => {
  const googleApiLoadStatus = useStoreState(
    (state) => state.googleDriveImportExport.apiBootStatus.kind
  );
  const launchImportProjectOperation = useStoreActions(
    (actions) => actions.googleDriveImportExport.importProjects
  );

  const importButtonIsDisabled = googleApiLoadStatus !== "succeeded";
  const importButtonText =
    googleApiLoadStatus === "failed"
      ? "Google Drive unavailable"
      : "Import from Google Drive";
  const showImportModal = () => launchImportProjectOperation();

  return (
    <Button disabled={importButtonIsDisabled} onClick={showImportModal}>
      {importButtonText}
    </Button>
  );
};

const ProjectListButtons: React.FC = () => {
  const selectedIds = useStoreState(
    (state) => state.projectCollection.availableSelectedIds
  );
  const launchCreate = useStoreActions(
    (actions) => actions.userConfirmations.createProjectInteraction.launch
  );
  const launchUpload = useStoreActions(
    (actions) => actions.userConfirmations.uploadZipfilesInteraction.launch
  );
  const clearAllSelected = useStoreActions(
    (actions) => actions.projectCollection.clearAllSelected
  );
  const requestConfirmation = useStoreActions(
    (actions) => actions.userConfirmations.requestDangerousActionConfirmation
  );

  // TODO: Clear all "isSelected" when leaving project list page?

  const nSelected = selectedIds.length;

  if (nSelected > 0) {
    const onDelete = () => {
      requestConfirmation({
        kind: "delete-many-projects",
        projectIds: selectedIds,
        actionIfConfirmed: {
          typePath: "projectCollection.requestDeleteManyProjectsThenResync",
          payload: selectedIds,
        },
      });
    };

    return (
      <div className="buttons some-selected">
        <div className="intro">
          <Button onClick={() => clearAllSelected()}>
            <FontAwesomeIcon icon="arrow-left" />
          </Button>
          <span>{nSelected}</span>
        </div>
        <Button variant="danger" onClick={onDelete}>
          DELETE
        </Button>
      </div>
    );
  } else {
    const showCreateModal = () => launchCreate();
    const showUploadModal = () => launchUpload();
    return (
      <div className="buttons">
        <Button onClick={showCreateModal}>Create new</Button>
        <Button onClick={showUploadModal}>Upload</Button>
        <ImportFromGoogleButton />
      </div>
    );
  }
};

const ProjectList: React.FC = () => {
  const available = useStoreState((state) => state.projectCollection.available);

  const selectedIds = useStoreState(
    (state) => state.projectCollection.availableSelectedIds
  );
  const anySelected = selectedIds.length > 0;

  return (
    <>
      <ProjectListButtons />
      <ul className={anySelected ? "some-selected" : ""}>
        {available.map((p) => (
          <Project key={p.summary.id} project={p} anySelected={anySelected} />
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
