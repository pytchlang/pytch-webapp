import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

import { useStoreActions, useStoreState } from "../store";

export const ConfirmProjectDeleteModal = () => {
  const modalName = "confirm-project-delete";

  const isShowing = useStoreState((state) =>
    state.modals.isShowing.get(modalName)
  );
  const projectId = useStoreState(
    (state) => state.userConfirmations.projectToDelete?.id ?? -1
  );
  const projectName = useStoreState(
    (state) =>
      state.userConfirmations.projectToDelete?.name ?? "SHOULD NEVER SEE THIS"
  );

  const { hide, requestDelete } = useStoreActions((actions) => ({
    hide: actions.modals.hide,
    requestDelete: actions.projectCollection.requestDeleteProject,
  }));

  const handleClose = () => {
    hide(modalName);
  };

  const handleConfirm = () => {
    requestDelete(projectId);
    hide(modalName);
  };

  return (
    <Modal show={isShowing} onHide={handleClose} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>Delete project?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to delete project <strong>{projectName}</strong>
          ?
        </p>
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
