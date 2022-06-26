import React, { ChangeEvent } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

export const CopyProjectModal = () => {
  const {
    isActive,
    inputsReady,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    sourceProjectId,
    nameOfCopy,
  } = useStoreState((state) => state.userConfirmations.copyProjectInteraction);

  const {
    dismiss,
    attempt,
    setNameOfCopy,
    refreshInputsReady,
  } = useStoreActions(
    (actions) => actions.userConfirmations.copyProjectInteraction
  );

  const handleClose = () => dismiss();
  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setNameOfCopy(evt.target.value);
    refreshInputsReady();
  };
  const handleSaveAs = () => {
    attempt({ sourceProjectId, nameOfCopy });
  };

  return (
    <Modal
      className="CopyProject"
      show={isActive}
      onHide={handleClose}
      animation={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>Copy project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Control
              readOnly={!isInteractable}
              type="text"
              value={nameOfCopy}
              onChange={handleChange}
              placeholder="Name for copy of project"
              tabIndex={-1}
            />
          </Form.Group>
        </Form>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Project copied!"
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={!isInteractable}
        >
          Cancel
        </Button>
        <Button
          disabled={!(isInteractable && inputsReady)}
          variant="primary"
          onClick={handleSaveAs}
        >
          Make a copy
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
