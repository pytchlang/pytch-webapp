import React, { useRef } from "react";
import { Link } from "./LinkWithinApp";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import PopperIDETooltip from "./PopperIDETooltip";

declare var Sk: any;

export const focusStage = () => {
  document.getElementById("pytch-speech-bubbles")?.focus();
};

const GreenFlag = () => {
  const build = useStoreActions((actions) => actions.activeProject.build);

  const referenceElt = useRef<HTMLDivElement | null>(null);

  const handleClick = () => build("running-project");

  return (
    <>
      <div
        className="StageControlPseudoButton GreenFlag"
        onClick={handleClick}
        ref={referenceElt}
      />
      <PopperIDETooltip
        referenceElement={referenceElt.current}
        targetTourStage="green-flag"
      >
        <p>Click the green flag to run the project</p>
      </PopperIDETooltip>
    </>
  );
};

const RedStop = () => {
  const redStop = () => {
    Sk.pytch.current_live_project.on_red_stop_clicked();
    focusStage();
  };
  return <div className="StageControlPseudoButton RedStop" onClick={redStop} />;
};

const StageControls = () => {
  const { codeStateVsStorage } = useStoreState((state) => state.activeProject);
  const { requestSyncToStorage } = useStoreActions(
    (actions) => actions.activeProject
  );
  const handleSave = () => requestSyncToStorage();

  const launchScreenshot = useStoreActions(
    (actions) => actions.userConfirmations.displayScreenshotInteraction.launch
  );
  const onScreenshot = () => launchScreenshot();

  const launchDownloadZipfile = useStoreActions(
    (actions) => actions.userConfirmations.downloadZipfileInteraction.launch
  );
  const onDownload = () => launchDownloadZipfile();

  const initiateButtonTour = useStoreActions(
    (actions) => actions.ideLayout.initiateButtonTour
  );
  const onShowTooltips = () => initiateButtonTour();

  return (
    <div className="StageControls">
      <GreenFlag />
      <RedStop />
      <Button
        className={`save-button ${codeStateVsStorage}`}
        onClick={handleSave}
      >
        <span>Save</span>
      </Button>
      <Link to="/my-projects/">
        <Button>MyStuff</Button>
      </Link>
      <DropdownButton alignRight title="⋮">
        <Dropdown.Item onClick={onScreenshot}>Screenshot</Dropdown.Item>
        <Dropdown.Item onClick={onDownload}>Download as zipfile</Dropdown.Item>
        <Dropdown.Item onClick={onShowTooltips}>Show tooltips</Dropdown.Item>
      </DropdownButton>
    </div>
  );
};

export default StageControls;
