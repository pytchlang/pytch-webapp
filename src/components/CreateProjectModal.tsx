import React, { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import { useStoreActions, useStoreState } from "../store";
import { focusOrBlurFun } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

export const CreateProjectModal = () => {
  const {
    isActive,
    inputsReady,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    name,
  } = useStoreState(
    (state) => state.userConfirmations.createProjectInteraction
  );

  const {
    dismiss,
    attempt,
    setName,
    refreshInputsReady,
  } = useStoreActions(
    (actions) => actions.userConfirmations.createProjectInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const handleCreate = () => attempt({ name });

  const handleChange = (evt: any) => {
    setName(evt.target.value);
    refreshInputsReady();
  };

  const handleClose = () => dismiss();

  const handleKeyPress: React.KeyboardEventHandler = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      if (inputsReady) {
        handleCreate();
      }
    }
  };

  return (
    <Modal show={isActive} onHide={handleClose} animation={false}>
      <Modal.Header>
        <Modal.Title>Create a new project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Control
              readOnly={!isInteractable}
              type="text"
              value={name}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Name for your new project"
              tabIndex={-1}
              ref={inputRef}
            />
          </Form.Group>
        </Form>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Project created!"
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
          onClick={handleCreate}
        >
          Create project
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateProjectModal;
