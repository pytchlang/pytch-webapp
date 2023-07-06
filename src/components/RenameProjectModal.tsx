import React, { ChangeEvent, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
import { focusOrBlurFun, submitOnEnterKeyFun } from "../utils";

export const RenameProjectModal = () => {
  const {
    projectId,
    oldName,
    newName,
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    inputsReady,
  } = useStoreState(
    (state) => state.userConfirmations.renameProjectInteraction
  );

  const { attempt, dismiss, setNewName, setInputsReady } = useStoreActions(
    (actions) => actions.userConfirmations.renameProjectInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const handleClose = () => dismiss();
  const handleRename = () => attempt({ projectId, newName });

  const handleKeyPress = submitOnEnterKeyFun(handleRename, inputsReady);

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;
    setInputsReady(value !== "" && value !== oldName);
    setNewName(value);
  };

  // onChange= set "user has modified suggestion" bit?

  return (
    <Modal show={isActive} onHide={handleClose} animation={false} centered>
      <Modal.Header closeButton={isInteractable}>
        <Modal.Title>Rename project “{oldName}”</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Control
            type="text"
            value={newName}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            tabIndex={-1}
            ref={inputRef}
          ></Form.Control>
        </Form>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Renamed!"
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
          onClick={handleRename}
        >
          Rename
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
