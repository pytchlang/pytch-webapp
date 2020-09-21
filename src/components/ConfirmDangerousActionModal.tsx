import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useStoreActions, useStoreState } from "../store";
import {
  DangerousActionProgress,
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
  const awaitingAction =
    actionToConfirm?.progress ===
    DangerousActionProgress.AwaitingActionCompletion;

  const handleClose = () => dismiss();
  const handleConfirm = () => invoke();

  // TODO: Allow this to be passed in?
  const actionText = "DELETE";

  return (
    <Modal show={isShowing} centered animation={false} onHide={handleClose}>
      {actionToConfirm && mainContentFromDescriptor(actionToConfirm.descriptor)}
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        {awaitingAction ? (
          <Button disabled variant="danger" className="awaiting-action">
            <span className="spacing-text">{actionText}</span>
            <span className="spinner-container">
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            </span>
          </Button>
        ) : (
          <Button variant="danger" onClick={handleConfirm}>
            {actionText}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
