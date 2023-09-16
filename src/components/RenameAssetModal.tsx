import React, { ChangeEvent, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
import { focusOrBlurFun, submitOnEnterKeyFun } from "../utils";

export const RenameAssetModal = () => {
  const {
    fixedPrefix,
    oldStem,
    newStem,
    fixedSuffix,
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    inputsReady,
  } = useStoreState((state) => state.userConfirmations.renameAssetInteraction);

  const { attempt, dismiss, setNewStem, setInputsReady } = useStoreActions(
    (actions) => actions.userConfirmations.renameAssetInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const oldBasename = `${oldStem}${fixedSuffix}`;

  const handleClose = () => dismiss();
  const handleRename = () => {
    // TODO: Put this logic all in one place.
    const newNameSuffix = `${newStem}${fixedSuffix}`;
    attempt({ fixedPrefix, oldNameSuffix: oldBasename, newNameSuffix });
  };

  const handleKeyPress = submitOnEnterKeyFun(handleRename, inputsReady);

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;
    setInputsReady(value !== "" && value !== oldNameSuffix);
    setNewNameSuffix(value);
  };

  // onChange= set "user has modified suggestion" bit?

  return (
    <Modal show={isActive} onHide={handleClose} animation={false} centered>
      <Modal.Header closeButton={isInteractable}>
        <Modal.Title>Rename “{oldBasename}”</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Control
            type="text"
            value={newNameSuffix}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
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
