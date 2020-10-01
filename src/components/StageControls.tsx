import React from "react";
import { Link } from "./LinkWithinApp";
import Button from "react-bootstrap/Button";
import { useStoreActions } from "../store";
import BuildButton from "./BuildButton";

declare var Sk: any;

const GreenFlag = () => {
  const greenFlag = () => {
    Sk.pytch.current_live_project.on_green_flag_clicked();
    document.getElementById("pytch-canvas")?.focus();
  };
  return (
    <div className="StageControlPseudoButton GreenFlag" onClick={greenFlag} />
  );
};

const RedStop = () => {
  const redStop = () => {
    Sk.pytch.current_live_project.on_red_stop_clicked();
    document.getElementById("pytch-canvas")?.focus();
  };
  return <div className="StageControlPseudoButton RedStop" onClick={redStop} />;
};

const StageControls = () => {
  const save = useStoreActions(
    (actions) => actions.activeProject.requestSyncToStorage
  );
  const handleSave = () => {
    save();
  };

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
