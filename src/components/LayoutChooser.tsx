import React from "react";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import WideInfoPane from "../images/wide-info-pane.png";
import TallCodeEditor from "../images/tall-code-editor.png";

export const LayoutChooser = () => {
  const layoutKind = useStoreState((state) => state.ideLayout.kind);
  const setLayout = useStoreActions((actions) => actions.ideLayout.setKind);

  const isWide = layoutKind === "wide-info-pane";

  return (
    <div className="LayoutChooser">
      <Button
        variant={isWide ? "primary" : "secondary"}
        onClick={() => setLayout("wide-info-pane")}
      >
        <img className="layout-icon" src={WideInfoPane} alt="Wide-Info" />
      </Button>
      <Button
        variant={isWide ? "secondary" : "primary"}
        onClick={() => setLayout("tall-code-editor")}
      >
        <img className="layout-icon" src={TallCodeEditor} alt="Tall-Code" />
      </Button>
    </div>
  );
};
