import React, { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmptyProps } from "../utils";
import { filenameFormatSpecifier } from "../model/format-spec-for-linked-content";
import { pathWithinApp } from "../env-utils";
import { Link, useNavigate } from "react-router-dom";
import { useRunFlow } from "../model";
import { uniqueUserInputFragment } from "../model/compound-text-input";
import { useResolveStringSpec } from "./hooks/resolve-string-spec";
import {faGoogleDrive} from "@fortawesome/free-brands-svg-icons";
import {IconDefinition} from "@fortawesome/fontawesome-svg-core";

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
  const { t } = useTranslation("ide");
  const buttonTourProgressStage = useStoreState(
    (state) => state.ideLayout.buttonTourProgressStage
  );
  const build = useStoreActions((actions) => actions.activeProject.build);

  const handleClick = () => build("running-project");

  const tooltipIsVisible = buttonTourProgressStage === "green-flag";

  return (
    <div className="tooltipped-elt">
      <Button
        title={"Run project"}
        className="StageControlPseudoButton GreenFlag"
        onClick={handleClick}
      >
        <FontAwesomeIcon
          icon="flag"
          // TODO: i18n for aria-label
          aria-label={"Run project"}
        />
      </Button>
      <StaticTooltip visible={tooltipIsVisible}>
        <p>{t("tooltip.green-flag")}</p>
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
    <Button
      // TODO: i18n for title
      title={"Stop project"}
      className="StageControlPseudoButton RedStop"
      onClick={redStop}
    >
      <FontAwesomeIcon icon="stop" aria-label={"Stop project"} />
    </Button>
  );
};

const ExportToDriveDropdownItem: React.FC<EmptyProps> = () => {
  const resolveStringSpec = useResolveStringSpec();
  const { t } = useTranslation("projects");
  const linkedContentLoadingState = useStoreState(
    (state) => state.activeProject.linkedContentLoadingState
  );
  const project = useStoreState((state) => state.activeProject.project);
  const launchExportProjectOperation = useStoreActions(
    (actions) => actions.googleDriveImportExport.exportProject
  );
  const onExport = () => {
    launchExportProjectOperation({
      project,
      linkedContentLoadingState,
      resolveStringSpec,
    });
  };

  const googleDriveStatus = useStoreState(
    (state) => state.googleDriveImportExport.apiBootStatus
  );

  switch (googleDriveStatus.kind) {
    case "not-yet-started":
    case "pending":
      return (
        <Dropdown.Item disabled>
          <FontAwesomeIcon
            icon={faGoogleDrive as IconDefinition}
            className={"me-2"}
            aria-hidden={true}
          />
          {t("export-to-google-drive")}
        </Dropdown.Item>
      );
    case "succeeded":
      return (
        <Dropdown.Item onClick={onExport}>
          <FontAwesomeIcon
            icon={faGoogleDrive as IconDefinition}
            className={"me-2"}
            aria-hidden={true}
          />
          {t("export-to-google-drive")}
        </Dropdown.Item>
      );
    case "failed":
      return (
        <Dropdown.Item disabled>
          <FontAwesomeIcon
            icon={faGoogleDrive as IconDefinition}
            className={"me-2"}
            aria-hidden={true}
          />
          {t("google-drive-unavailable")}
        </Dropdown.Item>
      );
  }
};

const LaunchCoordsChooserDropdownItem: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  const setCoordsChooserState = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.setStateKind
  );
  const launchCoordsChooser = () => setCoordsChooserState("active");

  return (
    <Dropdown.Item onClick={launchCoordsChooser}>
      {t("project-action.show-coords")}
    </Dropdown.Item>
  );
};

const GoToMyProjectsDropdownItem: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("projects");
  const navigate = useNavigate();
  const goToMyProjects = () => navigate(pathWithinApp("/my-projects/"));
  return (
    <Dropdown.Item onClick={goToMyProjects}>
      <FontAwesomeIcon icon="code" className={"me-2"} />
      {t("page-heading")}
    </Dropdown.Item>
  );
};

export const ProjectControls: React.FC<EmptyProps> = () => {
  const resolveStringSpec = useResolveStringSpec();
  const { t } = useTranslation("ide");
  const { t: tProjects } = useTranslation("projects");
  const navigate = useNavigate();
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
  const uiFragment = uniqueUserInputFragment(formatSpecifier);
  const uiFragmentInitialValue = resolveStringSpec(uiFragment.initialValue);
  const onDownload = () =>
    runDownloadZipfiles({ project, formatSpecifier, uiFragmentInitialValue });

  const initiateButtonTour = useStoreActions(
    (actions) => actions.ideLayout.initiateButtonTour
  );
  const onShowTooltips = () => initiateButtonTour();

  const runSaveProjectAs = useRunFlow((f) => f.saveProjectAsFlow);
  const initialNameOfCopy = tProjects("copy.initial-name", {
    replace: { sourceName: project.name },
  });
  const copyArgs = {
    sourceProjectId: project.id,
    initialNameOfCopy,
    sourceLinkedContentRef: project.linkedContentRef,
  };
  const onCreateCopy = () => runSaveProjectAs(copyArgs);

  const fullScreenButton = (
    <Button
      // TODO: i18n for title
      title={"Enter fullscreen"}
      className="full-screen square-button"
      onClick={() => setIsFullScreen(true)}
    >
      <FontAwesomeIcon
        className="fa-lg"
        icon="expand"
        aria-label={"Enter fullscreen"}
      />
    </Button>
  );

  const goHome = () => navigate(pathWithinApp("/"));

  return (
    <>
      <Button
        // TODO: i18n for title
        title={"Save project"}
        className={`save-button h-100 d-flex align-items-center ${codeStateVsStorage}`}
        onClick={handleSave}
        disabled={codeStateVsStorage === "no-changes-since-last-save"}
      >
        <FontAwesomeIcon
          className="fa-lg"
          icon="floppy-disk"
          // TODO: i18n for aria-label
          aria-label={"Save project"}
        />
        <span className={"mx-1"}>
          {/*TODO: i18n*/}
          {codeStateVsStorage === "unsaved-changes-exist"
            ? t("project-action.save")
            : "Saved"}
        </span>
      </Button>
      <Link
        to={"/"}
        className={"StageControlPseudoButton HomeLink h-100 w-auto p-2"}
        aria-label={t("home-button.aria-label")}
      >
        <FontAwesomeIcon icon="home" aria-hidden={true} />
        <span className={"ps-1"}>Home</span>
      </Link>
      <DropdownButton
        align="end"
        title={
          <FontAwesomeIcon
            icon="ellipsis-vertical"
            aria-hidden={true}
            aria-label={"More project options"}
            title={"More project options"}
          />
        }
        className={"moreOptionsDropdown p-0"}
      >
        <GoToMyProjectsDropdownItem />
        <Dropdown.Item onClick={onScreenshot}>
          <FontAwesomeIcon
            icon="camera"
            className={"me-2"}
            aria-hidden={true}
          />
          {t("project-action.screenshot")}
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={onCreateCopy}>
          <FontAwesomeIcon icon="clone" className={"me-2"} aria-hidden={true} />
          {t("project-action.make-copy")}
        </Dropdown.Item>
        <Dropdown.Item onClick={onDownload}>
          <FontAwesomeIcon icon="download" className={"me-2"} />
          {t("project-action.download-zip")}
        </Dropdown.Item>
        <ExportToDriveDropdownItem />
        <Dropdown.Divider />
        <LaunchCoordsChooserDropdownItem />
        <Dropdown.Item onClick={onShowTooltips}>
          {t("project-action.show-tooltips")}
        </Dropdown.Item>
      </DropdownButton>
    </>
  );
};
