import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
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
    filename,
    fileContents,
  } = useStoreState(
    (state) => state.userConfirmations.downloadZipfileInteraction
  );

  const { dismiss, attempt, setFilename, setInputsReady } = useStoreActions(
    (actions) => actions.userConfirmations.downloadZipfileInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(() => {
    if (isActive) {
      const inputElt = inputRef.current!;
      if (isInteractable) {
        inputElt.focus();
      } else {
        inputElt.blur();
      }
    }
  });

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;
    setInputsReady(value !== "" && fileContents != null);
    setFilename(value);
  };

  const handleClose = () => dismiss();
  const handleDownload = () =>
    attempt({
      filename,
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

        <Form>
          <Form.Control
            type="text"
            value={filename}
            onChange={handleChange}
            tabIndex={-1}
            ref={inputRef}
          />
        </Form>

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
