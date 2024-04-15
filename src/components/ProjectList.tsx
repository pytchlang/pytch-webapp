import React, { useEffect } from "react";
import { IDisplayedProjectSummary, LoadingStatus } from "../model/projects";
import { useStoreState, useStoreActions } from "../store";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import NavBanner from "./NavBanner";
import { pathWithinApp } from "../env-utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { EmptyProps, assertNever } from "../utils";
import { MtimeDisplay } from "./MtimeDisplay";
import { EditorKindThumbnail } from "./EditorKindThumbnail";


type ProjectCardProps = {
  project: IDisplayedProjectSummary;
  anySelected: boolean;
};

const Project: React.FC<ProjectCardProps> = ({ project, anySelected }) => {
  const navigate = useNavigate();

  const launchDeleteAction = useStoreActions(
    (actions) => actions.userConfirmations.launchDeleteProject
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
  const ensureNotFullScreen = useStoreActions(
    (actions) => actions.ideLayout.ensureNotFullScreen
  );

  const summary = project.summary.summary ?? "";
  const linkTarget = `/ide/${project.summary.id}`;

  const onDelete = () => {
    launchDeleteAction({
      projectName: project.summary.name,
      projectId: project.summary.id,
    });
  };

  const onActivate = () => {
    if (anySelected) {
      toggleSelected(project.summary.id);
    } else {
      // TODO: Should the following be done in the model?
      dismissButtonTour();
      ensureNotFullScreen("restore-layout");
      navigate(pathWithinApp(linkTarget));
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
            <p className="project-name">{project.summary.name}</p>
            <MtimeDisplay mtime={project.summary.mtime} />
            <p className="project-summary">{summary}</p>
          </div>
          <EditorKindThumbnail programKind={project.summary.programKind} />
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

const ImportFromGoogleButton: React.FC<EmptyProps> = () => {
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

const ProjectListButtons: React.FC<EmptyProps> = () => {
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
  const launchDeleteAction = useStoreActions(
    (actions) => actions.userConfirmations.launchDeleteManyProjects
  );

  // TODO: Clear all "isSelected" when leaving project list page?

  const nSelected = selectedIds.length;

  if (nSelected > 0) {
    const onDelete = () => launchDeleteAction({ projectIds: selectedIds });

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

const componentFromState = (stateKind: LoadingStatus["kind"]): React.FC => {
  switch (stateKind) {
    case "pending":
      return ProjectsLoadingPending;
    case "succeeded":
      return ProjectList;
    case "failed":
      return ProjectsLoadingFailed;
    default:
      return assertNever(stateKind);
  }
};

const MaybeProjectList: React.FC<EmptyProps> = () => {
  // Don't care about the value; just want to know when it changes.
  useStoreState((state) => state.projectCollection.loadSeqnumNeeded);

  const doLoadingWork = useStoreActions(
    (actions) => actions.projectCollection.doLoadingWork
  );
  const deactivateProject = useStoreActions(
    (actions) => actions.activeProject.deactivate
  );
  const loadingStatus = useStoreState(
    (state) => state.projectCollection.loadingStatus
  );

  useEffect(() => {
    document.title = "Pytch: My projects";
    doLoadingWork();
  });

  const paneRef: React.RefObject<HTMLDivElement> = React.createRef();

  useEffect(() => {
    deactivateProject();
    paneRef.current?.focus();
  });

  const InnerComponent = componentFromState(loadingStatus.kind);

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
