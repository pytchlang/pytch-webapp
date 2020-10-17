import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import { useStoreActions, useStoreState } from "../store";
import { failIfNull } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

export const DownloadZipfileModal = () => {
  const {
    isActive,
    inputsReady,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    fileContents,
  } = useStoreState(
    (state) => state.userConfirmations.downloadZipfileInteraction
  );

  const { dismiss, attempt } = useStoreActions(
    (actions) => actions.userConfirmations.downloadZipfileInteraction
  );

  const handleClose = () => dismiss();
  const handleDownload = () =>
    attempt({
      data: failIfNull(
        fileContents,
        "cannot do download if file contents null"
      ),
    });

  return (
    <Modal
      className="DownloadZipfile"
      show={isActive}
      onHide={handleClose}
      animation={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>
          {inputsReady ? "Download zipfile" : "Preparing zipfile..."}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="icon-container">
          {inputsReady ? (
            <FontAwesomeIcon className="fa-5x" icon="file-archive" />
          ) : null}
          {!inputsReady ? <Spinner animation="border" /> : null}
        </div>

        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Downloading!"
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={!isInteractable}
          variant="secondary"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          disabled={!(isInteractable && inputsReady)}
          variant="primary"
          onClick={handleDownload}
        >
          Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
