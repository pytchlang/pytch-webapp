import React, { useEffect } from "react";
import { IDisplayedProjectSummary, LoadingStatus } from "../model/projects";
import { useStoreState, useStoreActions } from "../store";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import NavBanner from "./NavBanner";
import { pathWithinApp } from "../env-utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { EmptyProps, assertNever } from "../utils";
import { MtimeDisplay } from "./MtimeDisplay";
import { EditorKindThumbnail } from "./EditorKindThumbnail";
import { useRunFlow } from "../model";
import {
  createFocusContext,
  FocusContext,
  useFocusContext,
} from "./hooks/focus-steering";
import {
  focusGroupItemClass,
  kFocusGroupContainerClassName,
} from "../model/junior/grouped-focus";
import { CaptiveContextMenu } from "./CaptiveContextMenu";

type ProjectCardProps = {
  project: IDisplayedProjectSummary;
  anySelected: boolean;
};

const Project: React.FC<ProjectCardProps> = ({ project, anySelected }) => {
  const focusContext = useFocusContext("my-projects-list");
  const navigate = useNavigate();

  const runDeleteProject = useRunFlow((f) => f.deleteProjectFlow);
  const runRenameProject = useRunFlow((f) => f.renameProjectFlow);
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
    runDeleteProject({
      id: project.summary.id,
      name: project.summary.name,
    });
  };

  const onActivate = () => {
    if (anySelected) {
      toggleSelected(project.summary.id);
    } else {
      // TODO: Should the following be done in the model?
      dismissButtonTour();
      ensureNotFullScreen();
      navigate(pathWithinApp(linkTarget));
    }
  };

  const onToggleIsSelected = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelected(project.summary.id);
  };

  const onRename = () => {
    runRenameProject({
      projectId: project.summary.id,
      oldName: project.summary.name,
    });
  };

  const maybeSelectedExtraClass = project.isSelected ? " selected" : "";

  return (
    <li>
      <CaptiveContextMenu.Container
        className={focusGroupItemClass("ProjectCard-wrapper")}
        onClick={focusContext.onGroupItemClick}
        onActivate={onActivate}
      >
      <Alert className="ProjectCard" variant="success">
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
            <CaptiveContextMenu.DropdownMenu>
              <CaptiveContextMenu.DropdownItem onInvoke={onActivate}>
                Open
              </CaptiveContextMenu.DropdownItem>
              <CaptiveContextMenu.DropdownItem onInvoke={onRename}>
                Rename...
              </CaptiveContextMenu.DropdownItem>
              <Dropdown.Divider />
              <CaptiveContextMenu.DropdownItem
                className="danger"
                onInvoke={onDelete}
              >
                DELETE
              </CaptiveContextMenu.DropdownItem>
            </CaptiveContextMenu.DropdownMenu>
          </div>
        </div>
      </Alert>
      </CaptiveContextMenu.Container>
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

const ImportFromGoogleButton: React.FC<{ key: React.Key }> = () => {
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
  const runCreateProject = useRunFlow((f) => f.createProjectFlow);
  const runUploadZipfiles = useRunFlow((f) => f.uploadZipfilesFlow);
  const runDeleteManyProjects = useRunFlow((f) => f.deleteManyProjectsFlow);

  const clearAllSelected = useStoreActions(
    (actions) => actions.projectCollection.clearAllSelected
  );

  // TODO: Clear all "isSelected" when leaving project list page?

  const nSelected = selectedIds.length;

  if (nSelected > 0) {
    const onDelete = () => runDeleteManyProjects({ ids: selectedIds });

    return (
      <div className="buttons some-selected">
        <div className="intro">
          <Button key="clear-selection" onClick={() => clearAllSelected()}>
            <FontAwesomeIcon icon="arrow-left" />
          </Button>
          <span>{nSelected}</span>
        </div>
        <Button key="delete-selected" variant="danger" onClick={onDelete}>
          DELETE
        </Button>
      </div>
    );
  } else {
    const showCreateModal = () => runCreateProject();
    const showUploadModal = () => runUploadZipfiles();
    return (
      <div className="buttons">
        <Button key="create-new" onClick={showCreateModal}>
          Create new
        </Button>
        <Button key="upload" onClick={showUploadModal}>
          Upload
        </Button>
        <ImportFromGoogleButton key="import-from-google" />
      </div>
    );
  }
};

const ProjectList: React.FC = () => {
  const focusContext = useFocusContext("my-projects-list");
  const available = useStoreState((state) => state.projectCollection.available);

  const selectedIds = useStoreState(
    (state) => state.projectCollection.availableSelectedIds
  );
  const anySelected = selectedIds.length > 0;

  return (
    <>
      <ProjectListButtons />
      <div
        ref={focusContext.groupContainerRefCallback()}
        className={kFocusGroupContainerClassName}
        data-grouped-focus-key="MyProjectsList"
      >
      <ol className={anySelected ? "some-selected" : ""}>
        {available.map((p) => (
          <Project key={p.summary.id} project={p} anySelected={anySelected} />
        ))}
      </ol>
      </div>
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

  const focusContext = createFocusContext("my-projects-list");
  return (
    <>
      <NavBanner />
      <div className="ProjectList" tabIndex={-1} ref={paneRef}>
        <h1>My projects</h1>
        <FocusContext.Provider value={focusContext}>
          <InnerComponent />
        </FocusContext.Provider>
      </div>
    </>
  );
};

export default MaybeProjectList;
