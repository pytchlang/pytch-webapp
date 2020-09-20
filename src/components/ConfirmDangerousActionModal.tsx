import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";

export const ConfirmDangerousActionModal = () => {
  const isShowing = useStoreState(
    (state) => state.userConfirmations.dangerousActionConfirmation != null
  );
  const dismiss = useStoreActions(
    (actions) => actions.userConfirmations.dismissDangerousAction
  );
  const invoke = useStoreActions(
    (actions) => actions.userConfirmations.invokeDangerousAction
  );

  const handleClose = () => dismiss();
  const handleConfirm = () => invoke();

  return (
    <Modal show={isShowing} centered animation={false} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Do dangerous thing?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to do something dangerous?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          DELETE
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
