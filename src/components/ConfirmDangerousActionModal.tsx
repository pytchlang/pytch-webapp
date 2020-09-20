import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import {
  IDangerousActionDescriptor,
  IDeleteProjectDescriptor,
} from "../model/ui";
import { ConfirmProjectDeleteModal } from "./ConfirmProjectDeleteModal";

const mainContentFromDescriptor = (descriptor: IDangerousActionDescriptor) => {
  switch (descriptor.kind) {
    case "delete-project":
      return (
        <ConfirmProjectDeleteModal
          descriptor={descriptor as IDeleteProjectDescriptor}
        />
      );
  }
};

export const ConfirmDangerousActionModal = () => {
  const actionToConfirm = useStoreState(
    (state) => state.userConfirmations.dangerousActionConfirmation
  );
  const dismiss = useStoreActions(
    (actions) => actions.userConfirmations.dismissDangerousAction
  );
  const invoke = useStoreActions(
    (actions) => actions.userConfirmations.invokeDangerousAction
  );
  const isShowing = actionToConfirm != null;

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
