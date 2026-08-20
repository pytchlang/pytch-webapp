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
import { Link } from "./LinkWithinApp";
import { useNavigate } from "react-router-dom";
import { useRunFlow } from "../model";
import { uniqueUserInputFragment } from "../model/compound-text-input";
import { useResolveStringSpec } from "./hooks/resolve-string-spec";

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
        className="StageControlPseudoButton GreenFlag"
        onClick={handleClick}
        aria-label={"Run project"}
      >
        <FontAwesomeIcon icon="play" aria-hidden={true} />
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
      className="StageControlPseudoButton RedStop"
      onClick={redStop}
      aria-label={"Stop project"}
    >
      <FontAwesomeIcon icon="stop" aria-hidden={true} />
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

  const idProp = { "data-item-id": "export-google" };

  switch (googleDriveStatus.kind) {
    case "not-yet-started":
    case "pending":
      return (
        <Dropdown.Item {...idProp} disabled>
          {t("export-to-google-drive")}
        </Dropdown.Item>
      );
    case "succeeded":
      return (
        <Dropdown.Item {...idProp} onClick={onExport}>
          {t("export-to-google-drive")}
        </Dropdown.Item>
      );
    case "failed":
      return (
        <Dropdown.Item {...idProp} disabled>
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
    <Dropdown.Item data-item-id="show-coords" onClick={launchCoordsChooser}>
      {t("project-action.show-coords")}
    </Dropdown.Item>
  );
};

const GoToMyProjectsDropdownItem: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("projects");
  const navigate = useNavigate();
  const goToMyProjects = () => navigate(pathWithinApp("/my-projects/"));
  return (
    <Dropdown.Item data-item-id={"my-projects"} onClick={goToMyProjects}>
      {t("page-heading")}
    </Dropdown.Item>
  );
};

export const StageControls: React.FC<EmptyProps> = () => {
  const resolveStringSpec = useResolveStringSpec();
  const { t } = useTranslation("ide");
  const { t: tProjects } = useTranslation("projects");
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
      className="full-screen square-button"
      onClick={() => setIsFullScreen(true)}
      aria-label={"expand"}
    >
      <FontAwesomeIcon className="fa-lg" icon="expand" aria-hidden={true} />
    </Button>
  );

  return isFullScreen ? (
    <section
      className="StageControls"
      aria-label={t("stage-controls.aria-label")}
    >
      <GreenFlag />
      <RedStop />
      <Button
        className="leave-full-screen"
        variant={"secondary"}
        onClick={() => setIsFullScreen(false)}
      >
        <FontAwesomeIcon className="fa-lg" icon="compress" aria-hidden={true} />
      </Button>
    </section>
  ) : (
    <section
      className="StageControls"
      aria-label={t("stage-controls.aria-label")}
    >
      <GreenFlag />
      <RedStop />
      {fullScreenButton}
      <Button
        className={`save-button ${codeStateVsStorage} square-button`}
        onClick={handleSave}
        aria-label={"Save project"}
      >
        <span>{t("project-action.save")}</span>
      </Button>
      <Link
        to={"/"}
        className={"StageControlPseudoButton HomeLink btn btn-primary"}
        aria-label={t("home-button.aria-label")}
      >
        <FontAwesomeIcon
          aria-label={t("home-button.aria-label")}
          icon="home"
          aria-hidden={true}
        />
      </Link>
      <DropdownButton align="end" title="⋮" className={"moreOptionsDropdown"}>
        <GoToMyProjectsDropdownItem />
        <Dropdown.Item data-item-id="screenshot" onClick={onScreenshot}>
          {t("project-action.screenshot")}
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item data-item-id="make-copy" onClick={onCreateCopy}>
          {t("project-action.make-copy")}
        </Dropdown.Item>
        <Dropdown.Item data-item-id="download-zip" onClick={onDownload}>
          {t("project-action.download-zip")}
        </Dropdown.Item>
        <ExportToDriveDropdownItem />
        <Dropdown.Divider />
        <LaunchCoordsChooserDropdownItem />
        <Dropdown.Item data-item-id="show-tooltips" onClick={onShowTooltips}>
          {t("project-action.show-tooltips")}
        </Dropdown.Item>
      </DropdownButton>
    </section>
  );
};
