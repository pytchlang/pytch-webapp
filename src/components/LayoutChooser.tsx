import React from "react";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import WideInfoPane from "../images/wide-info-pane.png";
import TallCodeEditor from "../images/tall-code-editor.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const LayoutChooser = () => {
  const layoutKind = useStoreState((state) => state.ideLayout.kind);
  const setLayout = useStoreActions((actions) => actions.ideLayout.setKind);
  const setIsFullScreen = useStoreActions(
    (actions) => actions.ideLayout.setIsFullScreen
  );

  const isWide = layoutKind === "wide-info-pane";
  const isTall = layoutKind === "tall-code-editor";

  return (
    <div className="LayoutChooser">
      <Button
        className="wide-info"
        variant={isWide ? "primary" : "secondary"}
        onClick={() => setLayout("wide-info-pane")}
      >
        <img
          className="layout-icon wide-info"
          src={WideInfoPane}
          alt="Wide-Info"
        />
      </Button>
      <Button
        className="tall-code"
        variant={isTall ? "primary" : "secondary"}
        onClick={() => setLayout("tall-code-editor")}
      >
        <img
          className="layout-icon tall-code"
          src={TallCodeEditor}
          alt="Tall-Code"
        />
      </Button>
      <Button
        className="full-screen"
        variant={"secondary"}
        onClick={() => setIsFullScreen(true)}
      >
        <FontAwesomeIcon className="fa-lg" icon="expand" />
      </Button>
    </div>
  );
};
