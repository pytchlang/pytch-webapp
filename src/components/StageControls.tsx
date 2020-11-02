import React from "react";
import { Link } from "./LinkWithinApp";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import BuildButton from "./BuildButton";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

declare var Sk: any;

export const focusStage = () => {
  document.getElementById("pytch-speech-bubbles")?.focus();
};

const GreenFlag = () => {
  const greenFlag = () => {
    Sk.pytch.current_live_project.on_green_flag_clicked();
    focusStage();
  };
  return (
    <div className="StageControlPseudoButton GreenFlag" onClick={greenFlag} />
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

  return (
    <div className="StageControls">
      <BuildButton />
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
      </DropdownButton>
    </div>
  );
};

export default StageControls;
