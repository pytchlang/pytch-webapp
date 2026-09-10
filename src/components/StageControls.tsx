import React, { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import Dropdown from "react-bootstrap/Dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmptyProps, tabIsActive} from "../utils";
import { filenameFormatSpecifier } from "../model/format-spec-for-linked-content";
import { pathWithinApp } from "../env-utils";
import { useNavigate } from "react-router-dom";
import { useRunFlow } from "../model";
import { uniqueUserInputFragment } from "../model/compound-text-input";
import { useResolveStringSpec } from "./hooks/resolve-string-spec";
import { ProjectControls } from "./ProjectControls";
import {faGoogleDrive} from "@fortawesome/free-brands-svg-icons";
import {IconDefinition} from "@fortawesome/fontawesome-svg-core";
import {ActivityBarTabKey} from "../model/junior/edit-state";
import {useJrEditActions, useJrEditState} from "./Junior/hooks";

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

  const tabs: Array<ActivityBarTabKey> = useStoreState(
      (state) => state.ideLayout.tabs
  );

  const resultsTab: ActivityBarTabKey | undefined = tabs.find((tab: ActivityBarTabKey) => tab === "results");

  const expandAction = useJrEditActions((a) => a.expandActivityContent);
  const activityContentState = useJrEditState((s) => s.activityContentState);

  const handleClick = () => {
    build("running-project");
    // TODO: move to results screen
    // check if results tab is already open
    // if not, open it
    if (resultsTab !== undefined && !tabIsActive(resultsTab, activityContentState)) {
      expandAction(resultsTab);
    }
  }

  const tooltipIsVisible = buttonTourProgressStage === "green-flag";

  return (
    <div className="tooltipped-elt">
      <Button
        title={"Run project"}
        className="StageControlPseudoButton GreenFlag"
        onClick={handleClick}
        aria-label={"Run project"}
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

  const layoutStyle = useStoreState((state) => state.ideLayout.layoutStyle);

  return isFullScreen ? (
    <section
      className="StageControls"
      aria-label={t("stage-controls.aria-label")}
    >
      <div className="run-stop-controls">
        <GreenFlag />
        <RedStop />
      </div>
      <Button
        // TODO: i18n for title
        title={"Leave fullscreen"}
        className="leave-full-screen"
        variant={"secondary"}
        onClick={() => setIsFullScreen(false)}
      >
        <FontAwesomeIcon
          className="fa-lg"
          icon="compress"
          // TODO: i18n for aria-label
          aria-label={"Leave fullscreen"}
        />
      </Button>
    </section>
  ) : (
    <section
      className={
        "StageControls" + (layoutStyle !== "split-screen" ? " me-2" : "")
      }
      aria-label={t("stage-controls.aria-label")}
    >
      <div className={"run-stop-controls"}>
        <GreenFlag />
        <RedStop />
      </div>
      {fullScreenButton}
      {layoutStyle === "split-screen" && <ProjectControls />}
    </section>
  );
};
