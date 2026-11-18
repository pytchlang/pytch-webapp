import React, { KeyboardEventHandler, PropsWithChildren, useRef } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import Dropdown from "react-bootstrap/Dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmptyProps } from "../utils";
import { filenameFormatSpecifier } from "../model/format-spec-for-linked-content";
import { pathWithinApp } from "../env-utils";
import { Link } from "./LinkWithinApp";
import { useNavigate } from "react-router-dom";
import { useRunFlow } from "../model";
import { uniqueUserInputFragment } from "../model/compound-text-input";
import { useResolveStringSpec } from "./hooks/resolve-string-spec";
import { zipfileDataFromProject } from "../storage/zipfile";
import { api } from "../model/cloud-storage";
import { parseProgramKind, parseProjectStatus } from "../model/user-interactions/create-project";
import { SectionWithHiddenH2 } from "./SectionWithHiddenH2";
import { MaybeSeizeFocus } from "./MaybeSeizeFocus";
import { AriaDisabledButton } from "./AriaDisabledButton";
import { handleMovementKeys } from "./CaptiveContextMenu-utils";
import { activeProject } from "../model/project";

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

type UnavailableDropdownItemProps = { itemId: string };
/** A dropdown item which cannot currently be chosen.  It stays
 * focusable but is marked `aria-disabled`, so assistive tech announces
 * it as unavailable.  See `AriaDisabledButton` for why we do not use the
 * `disabled` prop of `Dropdown.Item`. */
const UnavailableDropdownItem: React.FC<
  PropsWithChildren<UnavailableDropdownItemProps>
> = ({ itemId, children }) => (
  <Dropdown.Item
    as={AriaDisabledButton}
    role="menuitem"
    data-item-id={itemId}
    className="unavailable"
    // Stopping propagation also stops react-bootstrap closing the menu,
    // as would happen for a "disabled" item.
    onClick={(evt) => evt.stopPropagation()}
  >
    {children}
  </Dropdown.Item>
);

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

  const itemId = "export-google";

  switch (googleDriveStatus.kind) {
    case "not-yet-started":
    case "pending":
      return (
        <UnavailableDropdownItem itemId={itemId}>
          {t("export-to-google-drive")}
        </UnavailableDropdownItem>
      );
    case "succeeded":
      return (
        <Dropdown.Item role="menuitem" data-item-id={itemId} onClick={onExport}>
          {t("export-to-google-drive")}
        </Dropdown.Item>
      );
    case "failed":
      return (
        <UnavailableDropdownItem itemId={itemId}>
          {t("google-drive-unavailable")}
        </UnavailableDropdownItem>
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
    <Dropdown.Item
      role="menuitem"
      data-item-id="show-coords"
      onClick={launchCoordsChooser}
    >
      {t("project-action.show-coords")}
    </Dropdown.Item>
  );
};

const GoToMyProjectsDropdownItem: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("projects");
  const navigate = useNavigate();
  const goToMyProjects = () => navigate(pathWithinApp("/my-projects/"));
  return (
    <Dropdown.Item
      role="menuitem"
      data-item-id={"my-projects"}
      onClick={goToMyProjects}
    >
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
  const ensureNotFullScreen = useStoreActions(
    (actions) => actions.ideLayout.ensureNotFullScreen
  );

  const runDisplayScreenshot = useRunFlow((f) => f.displayScreenshotFlow);
  const onScreenshot = () => runDisplayScreenshot();

  const runDownloadZipfiles = useRunFlow((f) => f.downloadZipfileFlow);
  const runUploadZipfileToCloud = useRunFlow((f) => f.uploadZipfileToCloudFlow)
  const formatSpecifier = filenameFormatSpecifier(linkedContentLoadingState);
  const uiFragment = uniqueUserInputFragment(formatSpecifier);
  const uiFragmentInitialValue = resolveStringSpec(uiFragment.initialValue);
  const onDownload = () =>
    runDownloadZipfiles({ project, formatSpecifier, uiFragmentInitialValue });

  const projectDescriptor = useStoreState(
      (state) => state.activeProject
  );

  const cloudProjectId = useStoreState(
      (state) => state.activeProject.cloudProjectId
  )

  const cloudUserId = useStoreState(
      (state) => state.activeProject.cloudUserId
  )

  const pnc = useStoreActions(
      (state) => state.activeProject.pulseNotableChange
  )

  const handleSave = async () => {
    requestSyncToStorage();
    if (cloudProjectId) {
      // TODO: compile active project into ZIP file
      // TODO: send post request to backend
      const fileContents = await zipfileDataFromProject(project);

      const title = project.name;
      const program_kind = project.program.kind;

      const mimeTypeOption = {type: "application/zip"};
      const zipBlob = new Blob([fileContents], mimeTypeOption);

      const body = JSON.stringify({
        title: title,
        program_kind: parseProgramKind(program_kind),
        status: parseProjectStatus("UNLISTED"),
        archived: false
      })

      const formdata = new FormData();
      formdata.append("uploaded", zipBlob);

      api(`projects/${cloudProjectId}/upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formdata
      } as RequestInit).then(data => {
        console.log("saved project", data);
        pnc(
            {
              kind: "project-saved-in-cloud-action-completed",
            }
        )
      })
    }
  }

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

  // As for captive context menus: react-bootstrap handles only up and
  // down arrows, so handle movement keys ourselves, to add Home, End,
  // PageUp, and PageDown.
  const menuKeyDown: KeyboardEventHandler<HTMLDivElement> = (evt) =>
    handleMovementKeys(evt.currentTarget, ".dropdown-item", evt);

  const fullScreenButtonRef = useRef<HTMLButtonElement>(null);
  const fullScreenButton = (
    <Button
      ref={fullScreenButtonRef}
      className="full-screen square-button"
      onClick={() => setIsFullScreen(true)}
      aria-label={t("enter-full-screen-button.aria-label")}
    >
      <FontAwesomeIcon className="fa-lg" icon="expand" aria-hidden={true} />
    </Button>
  );

  return isFullScreen ? (
    <SectionWithHiddenH2
      className="StageControls"
      headingContent={t("stage-controls.aria-label")}
    >
      <GreenFlag />
      <RedStop />
      <Button
        className="leave-full-screen"
        variant={"secondary"}
        onClick={() => ensureNotFullScreen("user")}
        aria-label={t("leave-full-screen-button.aria-label")}
      >
        <FontAwesomeIcon className="fa-lg" icon="compress" aria-hidden={true} />
      </Button>
    </SectionWithHiddenH2>
  ) : (
    <SectionWithHiddenH2
      className="StageControls"
      headingContent={t("stage-controls.aria-label")}
    >
      <GreenFlag />
      <RedStop />
      <MaybeSeizeFocus
        target="enter-full-screen-button"
        targetRef={fullScreenButtonRef}
      />
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
      <Dropdown align="end" className={"moreOptionsDropdown"}>
        <Dropdown.Toggle aria-label={t("more-options-button.aria-label")}>
          ⋮
        </Dropdown.Toggle>
        {/* Render the menu even before it is first shown, so that
            react-bootstrap sees its role and gives the toggle
            aria-haspopup. */}
        <Dropdown.Menu role="menu" renderOnMount onKeyDown={menuKeyDown}>
          <GoToMyProjectsDropdownItem />
          <Dropdown.Item
            role="menuitem"
            data-item-id="screenshot"
            onClick={onScreenshot}
          >
            {t("project-action.screenshot")}
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item
            role="menuitem"
            data-item-id="make-copy"
            onClick={onCreateCopy}
          >
            {t("project-action.make-copy")}
          </Dropdown.Item>
          <Dropdown.Item
            role="menuitem"
            data-item-id="download-zip"
            onClick={onDownload}
          >
            {t("project-action.download-zip")}
          </Dropdown.Item>
          <ExportToDriveDropdownItem />
          <Dropdown.Divider />
          <LaunchCoordsChooserDropdownItem />
          <Dropdown.Item
            role="menuitem"
            data-item-id="show-tooltips"
            onClick={onShowTooltips}
          >
            {t("project-action.show-tooltips")}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </SectionWithHiddenH2>
  );
};
