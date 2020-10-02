import React from "react";
import { Link } from "./LinkWithinApp";
import Button from "react-bootstrap/Button";
import { useStoreActions } from "../store";
import BuildButton from "./BuildButton";

declare var Sk: any;

export const focusStage = () => {
  document.getElementById("pytch-canvas")?.focus();
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
  const { requestSyncToStorage } = useStoreActions(
    (actions) => actions.activeProject
  );
  const handleSave = () => requestSyncToStorage();

  return (
    <div className="StageControls">
      <BuildButton />
      <GreenFlag />
      <RedStop />
      <Button onClick={handleSave}>Save</Button>
      <Link to="/my-projects/">
        <Button>MyStuff</Button>
      </Link>
    </div>
  );
};

export default StageControls;
