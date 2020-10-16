import React, { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { stageWidth, stageHeight } from "../constants";
import { useStoreActions, useStoreState } from "../store";
import { failIfNull } from "../utils";

export const DisplayScreenshotModal = () => {
  const { isActive } = useStoreState(
    (state) => state.userConfirmations.displayScreenshotInteraction
  );

  const { dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.displayScreenshotInteraction
  );

  const handleClose = () => dismiss();

  const imgRef: React.RefObject<HTMLImageElement> = React.createRef();
  useEffect(() => {
    if (isActive) {
      const img = failIfNull(imgRef.current, "imgRef is null");
      const canvas = failIfNull(
        document.getElementById("pytch-canvas") as HTMLCanvasElement | null,
        "could not find canvas element"
      );
      img.src = canvas.toDataURL();
    }
  });

  return (
    <Modal
      className="DisplayScreenshot"
      size="lg"
      show={isActive}
      onHide={handleClose}
      animation={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>Screenshot</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Right-click on the image to copy or save:</p>
        <img
          ref={imgRef}
          width={stageWidth}
          height={stageHeight}
          alt="snapshot of stage"
        ></img>
      </Modal.Body>{" "}
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
