import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import { useStoreActions, useStoreState } from "../store";
import { focusOrBlurFun } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
import { CompoundTextInput } from "./CompoundTextInput";

export const DownloadZipfileModal = () => {
  const {
    isActive,
    inputsReady,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    fileContents,
    formatSpecifier,
  } = useStoreState(
    (state) => state.userConfirmations.downloadZipfileInteraction
  );

  const { dismiss, attempt, setUiFragmentValue, attemptArgs } = useStoreActions(
    (actions) => actions.userConfirmations.downloadZipfileInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const handleChange = (value: string) => {
    setUiFragmentValue(value);
  };

  const handleClose = () => dismiss();
  const handleDownload = () => attempt(attemptArgs());

  const handleEnterKey = () => {
    if (inputsReady) {
      handleDownload();
    }
  };

  const haveFileContents = fileContents != null;

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
          {haveFileContents ? "Download zipfile" : "Preparing zipfile..."}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="icon-container">
          {haveFileContents ? (
            <FontAwesomeIcon className="fa-5x" icon="file-archive" />
          ) : (
            <Spinner animation="border" />
          )}
        </div>

        <CompoundTextInput
          formatSpecifier={formatSpecifier}
          onNewUiFragmentValue={handleChange}
          onEnterKey={handleEnterKey}
          ref={inputRef}
        />

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
