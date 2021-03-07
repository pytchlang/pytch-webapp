import React, { useRef } from "react";
import Button from "react-bootstrap/Button";
import { useStoreState, useStoreActions } from "../store";
import PopperIDETooltip from "./PopperIDETooltip";

const BuildButton = () => {
  const haveCode = useStoreState((state) => state.activeProject.haveProject);
  const build = useStoreActions((actions) => actions.activeProject.build);

  const onBuild = () => {
    console.log("BUILD click");
    build();
  };

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <Button disabled={!haveCode} onClick={onBuild} ref={buttonRef}>
        BUILD
      </Button>
      <PopperIDETooltip
        referenceElement={buttonRef.current}
        targetTourStage="build-button"
      >
        <p>
          Click the <span className="button-name">BUILD</span> button to build
          the project
        </p>
      </PopperIDETooltip>
    </>
  );
};

export default BuildButton;
