import React from "react";
import { Link } from "@reach/router";
import Button from "react-bootstrap/Button";
import { useStoreActions } from "../store";

const StageControls = () => {
    const save = useStoreActions(actions => actions.activeProject.requestCodeSyncToStorage);
    const handleSave = () => { save(); };

    return (
        <div className="Stage">
            Build / GREEN / RED /
            <Button onClick={handleSave}>Save</Button> / <Link to="/my-projects/"><Button>MENU</Button></Link>
        </div>
    )
};

export default StageControls;
