import React, {
  KeyboardEventHandler,
  MouseEventHandler,
  useEffect,
} from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Card from "react-bootstrap/Card";
import { ContentLoadingSpinner } from "./Junior/ContentLoadingSpinner";
import { useTranslation } from "react-i18next";
import { IDisplayedProjectSummary, LoadingStatus } from "../model/projects";
import { useStoreState, useStoreActions } from "../store";
import { NavBanner } from "./NavBanner";
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
  kFocusGroupFallbackClassName,
} from "../model/junior/grouped-focus";
import { CaptiveContextMenu } from "./CaptiveContextMenu";
import { FocusGroupContainer } from "./FocusGroupContainer";
import { NotableChangeToasts } from "./NotableChangeToasts";
import { ErrorFetchingSomething } from "./ErrorFetchingSomething";
import {Col, Container, Row} from "react-bootstrap";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import "./pytch-myprojects.scss";

type ProjectCardProps = {
  project: IDisplayedProjectSummary;
  anySelected: boolean;
};

const Project: React.FC<ProjectCardProps> = ({ project, anySelected }) => {
  const { t } = useTranslation("projects");
  const { t: tCommon } = useTranslation("common");
  const focusContext = useFocusContext("my-projects-list");
  const navigate = useNavigate();

  const runDeleteProject = useRunFlow((f) => f.deleteProjectFlow);
  const runRenameProject = useRunFlow((f) => f.renameProjectFlow);
  const runPublishProject = useRunFlow((f) => f.publishProjectFlow);

  const toggleSelected = useStoreActions(
      (actions) => actions.projectCollection.toggleProjectSelected
  );

  const dismissButtonTour = useStoreActions(
      (actions) => actions.ideLayout.dismissButtonTour
  );
  const ensureNotFullScreen = useStoreActions(
      (actions) => actions.ideLayout.ensureNotFullScreen
  );
  const clearAllSelected = useStoreActions(
      (actions) => actions.projectCollection.clearAllSelected
  );

  const summary = project.summary.summary ?? "";
  const linkTarget = `/ide/${project.summary.id}`;

  const onDelete = () => {
    runDeleteProject({
      id: project.summary.id,
      name: project.summary.name,
      onDispose: focusContext.onDisposeDeleteProject,
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

  const onToggleIsSelected: MouseEventHandler<HTMLElement> = (e) => {
    // Stop the click passing through and opening the project:
    e.stopPropagation();
    focusContext.onGroupItemClick(e);
    toggleSelected(project.summary.id);
  };

  const onRename = () => {
    runRenameProject({
      projectId: project.summary.id,
      oldName: project.summary.name,
      onDispose: focusContext.onDisposeRenameProject,
    });
  };

  const onPublish = () => {
    runPublishProject(
        {
          cloudProjectId: project.summary.cloudProjectId,
          projectName: project.summary.name,
          onDispose: focusContext.onDisposeRenameProject,
        }
    );
  };

  const maybeSelectedExtraClass = project.isSelected ? " selected" : "";

  const onKeyDown: KeyboardEventHandler = (evt) => {
    switch (evt.key) {
      case "x": {
        toggleSelected(project.summary.id);
        break;
      }
      case "Escape": {
        clearAllSelected();
        break;
      }
    }
  };

  // The click handling for tracking the group focus bookmark is a bit
  // spread out to cover the various cases.

  const cloudUsername = useStoreState((state) => state.cloudUser.username);

  return (
      <li>
        <CaptiveContextMenu.Container
            onKeyDown={onKeyDown}
            className={focusGroupItemClass("ProjectCard-wrapper")}
            onActivate={onActivate}
        >
          <Card className="ProjectCard" onClick={focusContext.onGroupItemClick}>
            <Card.Header>
              <Row>
                <span
                    className={`selection-check${maybeSelectedExtraClass} me-auto`}
                    onClick={onToggleIsSelected}
                >
                  <FontAwesomeIcon className="fa-lg" icon="check-circle" />
                </span>
              </Row>
              <div className={"d-flex flex-row"}>

                <EditorKindThumbnail programKind={project.summary.programKind} />
                { project.summary.cloudProjectId !== null ?
                    <FontAwesomeIcon icon={"cloud"} className={"my-auto ms-3"} size={"lg"}/>
                    : undefined
                }
              </div>
              <div
                  className="dropdown-wrapper"
                  onClick={(e) => {
                    // Stop the click passing through and opening the project:
                    e.stopPropagation();
                    focusContext.onGroupItemClick(e);
                  }}
              >
                <CaptiveContextMenu.DropdownMenu>
                  <CaptiveContextMenu.DropdownItem onInvoke={onActivate}>
                    {t("action.open")}
                  </CaptiveContextMenu.DropdownItem>
                  <CaptiveContextMenu.DropdownItem onInvoke={onRename}>
                    {tCommon("action.rename")}
                  </CaptiveContextMenu.DropdownItem>
                  {project.summary.cloudProjectId ?
                      <CaptiveContextMenu.DropdownItem onInvoke={onPublish}>
                        Publish
                      </CaptiveContextMenu.DropdownItem>
                      :
                      <CaptiveContextMenu.DropdownItem onInvoke={onPublish}>
                        Upload to cloud (TODO)
                      </CaptiveContextMenu.DropdownItem>
                  }

                  <Dropdown.Divider />
                  <CaptiveContextMenu.DropdownItem
                      className="danger"
                      onInvoke={onDelete}
                  >
                    {tCommon("action.delete")}
                  </CaptiveContextMenu.DropdownItem>
                </CaptiveContextMenu.DropdownMenu>
              </div>
            </Card.Header>
            <Card.Body>
              <Card.Title className="project-name">
                {project.summary.name}
              </Card.Title>
              <div
                  className="project-card-content"
                  data-project-id={project.summary.id}
              >
                <div className="project-description">
                  <p className="project-summary mb-3">{summary}</p>
                  <MtimeDisplay mtime={project.summary.mtime} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </CaptiveContextMenu.Container>
      </li>
  );
};

const ProjectsLoadingPending: React.FC = () => {
  return (
      <div className="w-100 d-flex justify-content-center">
        <Spinner animation="border" />
      </div>
  );
};

const ProjectsLoadingFailed: React.FC = () => {
  return <ErrorFetchingSomething resourceKeySuffix="project-list" />;
};

const ImportFromGoogleButton: React.FC<{ key: React.Key }> = () => {
  const { t } = useTranslation("projects");
  const googleApiLoadStatus = useStoreState(
      (state) => state.googleDriveImportExport.apiBootStatus.kind
  );
  const launchImportProjectOperation = useStoreActions(
      (actions) => actions.googleDriveImportExport.importProjects
  );

  const importButtonIsDisabled = googleApiLoadStatus !== "succeeded";
  const importButtonText =
      googleApiLoadStatus === "failed"
          ? t("google-drive-unavailable")
          : t("import-from-google-drive");
  const showImportModal = () => launchImportProjectOperation();

  return (
      <Button disabled={importButtonIsDisabled} onClick={showImportModal} className={"project-list-button"}>
        {importButtonText}
      </Button>
  );
};

const ProjectListButtons: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("projects");
  const { t: tCommon } = useTranslation("common");
  const focusContext = useFocusContext("my-projects-list");

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
    function onCancel() {
      clearAllSelected();
      focusContext.onDisposeDeleteProject("cancelled-by-user");
    }

    const onDelete = () =>
        runDeleteManyProjects({
          ids: selectedIds,
          onDispose: focusContext.onDisposeDeleteProject,
        });

    return (
        <div className="buttons some-selected">
          <div className="intro">
            <Button key="clear-selection" onClick={onCancel}>
              <FontAwesomeIcon icon="arrow-left" />
            </Button>
            <span>{nSelected}</span>
          </div>
          <Button key="delete-selected" variant="danger" onClick={onDelete}>
            {tCommon("action.delete")}
          </Button>
        </div>
    );
  } else {
    const createArgs = { initialName: t("create.initial-name") };
    const showCreateModal = () => runCreateProject(createArgs);
    const showUploadModal = () => runUploadZipfiles();
    return (
        <div className="buttons">
          <Button
              key="create-new"
              className={kFocusGroupFallbackClassName + " project-list-button"}
              onClick={showCreateModal}
          >
            {t("action.create-new")}
          </Button>
          <Button key="upload" className={"project-list-button"} onClick={showUploadModal}>
            {t("action.upload")}
          </Button>
          <ImportFromGoogleButton key="import-from-google" />
        </div>
    );
  }
};

const LoadedProjectList: React.FC = () => {
  const available = useStoreState((state) => state.projectCollection.available);

  const selectedIds = useStoreState(
      (state) => state.projectCollection.availableSelectedIds
  );
  const anySelected = selectedIds.length > 0;

  // Mark as a global-focus-steering target even though there is no
  // keystroke shortcut for it.  We use this for directing focus after
  // settling an operation on a project (rename or delete).
  return (
      <>
        <FocusGroupContainer
            className="gfs__projects__container"
            groupedFocusKey="MyProjectsList"
        >
          <Container>
            <Row>
              <ProjectListButtons />
            </Row>
            <Row>
              <Col xs={0} sm={0} md={6} lg={8}></Col>
              <Col className={"d-flex flex-row"}>
                <Form.Select aria-label="Default select example">
                  <option>All projects</option>
                  <option value="1">Cloud projects</option>
                  <option value="2">Local projects</option>
                </Form.Select>

                <Form.Select aria-label="Default select example">
                  <option>Program type</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                </Form.Select>

                <Form.Select aria-label="Default select example">
                  <option>Sort by</option>
                  <option value="1">Last modified</option>
                  <option value="2">A-Z</option>
                </Form.Select>
              </Col>
            </Row>
            <ol className={anySelected ? "some-selected" : ""}>
              <Row>
                {available.map((p) => (
                    <Col xs={12} sm={6} md={4} lg={3}>
                      <Project key={p.summary.id} project={p} anySelected={anySelected} />
                    </Col>
                ))}
              </Row>
            </ol>
          </Container>
        </FocusGroupContainer>
      </>
  );
};

const componentFromState = (stateKind: LoadingStatus["kind"]): React.FC => {
  switch (stateKind) {
    case "pending":
      return ContentLoadingSpinner;
    case "succeeded":
      return LoadedProjectList;
    case "failed":
      return ProjectsLoadingFailed;
    default:
      return assertNever(stateKind);
  }
};

const MaybeProjectList: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("projects");

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
    document.title = t("page-title");
    doLoadingWork();
  });

  const paneRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    deactivateProject();
    paneRef.current?.focus();
  });

  const InnerComponent = componentFromState(loadingStatus.kind);

  return (
      <>
        <NavBanner />
        <NotableChangeToasts />
        <div className="ProjectList" tabIndex={-1} ref={paneRef}>
          <h1>{t("page-heading")}</h1>
          <InnerComponent />
        </div>
      </>
  );
};

export const ProjectList: React.FC<EmptyProps> = () => {
  const focusContext = createFocusContext("my-projects-list");
  return (
      <FocusContext value={focusContext}>
        <MaybeProjectList />
      </FocusContext>
  );
};
