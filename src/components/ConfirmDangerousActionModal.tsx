import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useStoreActions, useStoreState } from "../store";
import {
  DangerousActionProgress,
  IDangerousActionDescriptor,
} from "../model/ui";
import { ConfirmProjectDeleteModal } from "./ConfirmProjectDeleteModal";

// For exhaustiveness checking, as per TypeScript Handbook.
const assertNever = (x: never): never => {
  throw Error(`should not be here; got ${x}`);
};

const contentFromDescriptor = (descriptor: IDangerousActionDescriptor) => {
  switch (descriptor.kind) {
    case "delete-project":
      return ConfirmProjectDeleteModal(descriptor);
    default:
      assertNever(descriptor);
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

  const content =
    actionToConfirm && contentFromDescriptor(actionToConfirm.descriptor);

  return (
    <Modal show={isShowing} centered animation={false} onHide={handleClose}>
      <Modal.Header closeButton={!awaitingAction}>
        {content?.header}
      </Modal.Header>
      <Modal.Body>{content?.body}</Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={awaitingAction}
        >
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
