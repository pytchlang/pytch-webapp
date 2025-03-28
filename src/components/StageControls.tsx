import React, { PropsWithChildren } from "react";
import { Link } from "./LinkWithinApp";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmptyProps } from "../utils";
import { filenameFormatSpecifier } from "../model/format-spec-for-linked-content";
import { pathWithinApp } from "../env-utils";
import { useNavigate } from "react-router-dom";
import { useRunFlow } from "../model";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

export const focusStage = () => {
  document.getElementById("pytch-speech-bubbles")?.focus();
};

const StaticTooltip: React.FC<PropsWithChildren<{ visible: boolean }>> = ({
  children,
  visible,
}) => {
  const visibilityClass = visible ? "shown" : "hidden";

  return (
    <div className={`pytch-static-tooltip ${visibilityClass}`}>
      <div className="spacer" />
      <div className="content">
        <FontAwesomeIcon className="fa-2x" icon="info-circle" />
        <div className="inner-content">{children}</div>
      </div>
    </div>
  );
};

const GreenFlag = () => {
  const buttonTourProgressStage = useStoreState(
    (state) => state.ideLayout.buttonTourProgressStage
  );
  const build = useStoreActions((actions) => actions.activeProject.build);

  const handleClick = () => build("running-project");

  const tooltipIsVisible = buttonTourProgressStage === "green-flag";

  return (
    <div className="tooltipped-elt">
      <Button
        className="StageControlPseudoButton GreenFlag"
        onClick={handleClick}
      >
        <FontAwesomeIcon icon="play" />
      </Button>
      <StaticTooltip visible={tooltipIsVisible}>
        <p>Click the green flag to run the project</p>
      </StaticTooltip>
    </div>
  );
};

export const RedStop = () => {
  const redStop = () => {
    Sk.pytch.current_live_project.on_red_stop_clicked();
    focusStage();
  };
  return (
    <Button className="StageControlPseudoButton RedStop" onClick={redStop}>
      <FontAwesomeIcon icon="stop" />
    </Button>
  );
};

const ExportToDriveDropdownItem: React.FC<EmptyProps> = () => {
  const linkedContentLoadingState = useStoreState(
    (state) => state.activeProject.linkedContentLoadingState
  );
  const project = useStoreState((state) => state.activeProject.project);
  const launchExportProjectOperation = useStoreActions(
    (actions) => actions.googleDriveImportExport.exportProject
  );
  const onExport = () => {
    launchExportProjectOperation({ project, linkedContentLoadingState });
  };

  const googleDriveStatus = useStoreState(
    (state) => state.googleDriveImportExport.apiBootStatus
  );

  switch (googleDriveStatus.kind) {
    case "not-yet-started":
    case "pending":
      return <Dropdown.Item disabled>Export to Google Drive</Dropdown.Item>;
    case "succeeded":
      return (
        <Dropdown.Item onClick={onExport}>Export to Google Drive</Dropdown.Item>
      );
    case "failed":
      return <Dropdown.Item disabled>Google Drive unavailable</Dropdown.Item>;
  }
};

const LaunchCoordsChooserDropdownItem: React.FC<EmptyProps> = () => {
  const setCoordsChooserState = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.setStateKind
  );
  const launchCoordsChooser = () => setCoordsChooserState("active");

  return (
    <Dropdown.Item onClick={launchCoordsChooser}>
      Show coordinates
    </Dropdown.Item>
  );
};

const GoToMyProjectsDropdownItem: React.FC<EmptyProps> = () => {
  const navigate = useNavigate();
  const goToMyProjects = () => navigate(pathWithinApp("/my-projects/"));
  return <Dropdown.Item onClick={goToMyProjects}>My projects</Dropdown.Item>;
};

export const StageControls: React.FC<EmptyProps> = () => {
  const isFullScreen = useStoreState(
    (state) => state.ideLayout.fullScreenState.isFullScreen
  );
  const linkedContentLoadingState = useStoreState(
    (state) => state.activeProject.linkedContentLoadingState
  );
  const { project, codeStateVsStorage } = useStoreState(
    (state) => state.activeProject
  );
  const { requestSyncToStorage } = useStoreActions(
    (actions) => actions.activeProject
  );
  const setIsFullScreen = useStoreActions(
    (actions) => actions.ideLayout.setIsFullScreen
  );

  const handleSave = () => requestSyncToStorage();

  const runDisplayScreenshot = useRunFlow((f) => f.displayScreenshotFlow);
  const onScreenshot = () => runDisplayScreenshot();

  const runDownloadZipfiles = useRunFlow((f) => f.downloadZipfileFlow);
  const formatSpecifier = filenameFormatSpecifier(linkedContentLoadingState);
  const onDownload = () => runDownloadZipfiles({ project, formatSpecifier });

  const initiateButtonTour = useStoreActions(
    (actions) => actions.ideLayout.initiateButtonTour
  );
  const onShowTooltips = () => initiateButtonTour();

  const runSaveProjectAs = useRunFlow((f) => f.saveProjectAsFlow);
  const copyArgs = { sourceProjectId: project.id, sourceName: project.name };
  const onCreateCopy = () => runSaveProjectAs(copyArgs);

  const fullScreenButton = (
    <Button className="full-screen" onClick={() => setIsFullScreen(true)}>
      <FontAwesomeIcon className="fa-lg" icon="expand" />
    </Button>
  );

  const ariaLabel = "Controls";

  return isFullScreen ? (
    <section className="StageControls" aria-label={ariaLabel}>
      <div className="run-stop-controls">
        <GreenFlag />
        <RedStop />
      </div>
      <Button
        className="leave-full-screen"
        variant={"secondary"}
        onClick={() => setIsFullScreen(false)}
      >
        <FontAwesomeIcon className="fa-lg" icon="compress" />
      </Button>
    </section>
  ) : (
    <section className="StageControls" aria-label={ariaLabel}>
      <GreenFlag />
      <RedStop />
      <Button
        className={`save-button ${codeStateVsStorage}`}
        onClick={handleSave}
      >
        <span>Save</span>
      </Button>
      {fullScreenButton}
      <Link to="/">
        <Button>
          <FontAwesomeIcon aria-label="Home" icon="home" />
        </Button>
      </Link>
      <DropdownButton align="end" title="⋮">
        <GoToMyProjectsDropdownItem />
        <Dropdown.Item onClick={onScreenshot}>Screenshot</Dropdown.Item>
        <Dropdown.Item onClick={onCreateCopy}>Make a copy...</Dropdown.Item>
        <Dropdown.Item onClick={onDownload}>Download as zipfile</Dropdown.Item>
        <ExportToDriveDropdownItem />
        <LaunchCoordsChooserDropdownItem />
        <Dropdown.Item onClick={onShowTooltips}>Show tooltips</Dropdown.Item>
      </DropdownButton>
    </section>
  );
};
