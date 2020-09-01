import React from "react";
import { Link } from "@reach/router";
import Button from "react-bootstrap/Button";
import { useStoreActions } from "../store";
import BuildButton from "./BuildButton";

const GreenFlag = () => {
    return <div className="StageControlPseudoButton GreenFlag"/>;
}

const RedStop = () => {
    return <div className="StageControlPseudoButton RedStop"/>;
}

const StageControls = () => {
    const save = useStoreActions(actions => actions.activeProject.requestCodeSyncToStorage);
    const handleSave = () => { save(); };

    return (
        <div className="StageControls">
            <BuildButton/>
            <GreenFlag/>
            <RedStop/>
            <Button onClick={handleSave}>Save</Button>
            <Link to="/my-projects/"><Button>MyStuff</Button></Link>
        </div>
    )
};

export default StageControls;
