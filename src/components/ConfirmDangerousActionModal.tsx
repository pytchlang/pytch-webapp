import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useStoreActions, useStoreState } from "../store";
import { DangerousActionDescriptor } from "../model/ui";
import { confirmProjectDeleteModalContent } from "./ConfirmProjectDeleteModal";
import { confirmAssetDeleteModalContent } from "./ConfirmAssetDeleteModal";
import { confirmDeleteManyProjectsModalContent } from "./ConfirmDeleteManyProjectsModal";
import { confirmDeleteHandlerContent } from "./Junior/ConfirmDeleteHandlerContent";
import { confirmDeleteSpriteContent } from "./Junior/confirmDeleteSpriteContent";
import { assertNever } from "../utils";

const contentFromDescriptor = (descriptor: DangerousActionDescriptor) => {
  switch (descriptor.kind) {
    case "delete-project":
      return confirmProjectDeleteModalContent(descriptor);
    case "delete-many-projects":
      return confirmDeleteManyProjectsModalContent(descriptor);
    case "delete-project-asset":
      return confirmAssetDeleteModalContent(descriptor);
    case "delete-junior-sprite":
      return confirmDeleteSpriteContent(descriptor);
    case "delete-junior-handler":
      return confirmDeleteHandlerContent(descriptor);
    default:
      assertNever(descriptor);
  }
};

export const ConfirmDangerousActionModal = () => {
  const state = useStoreState(
    (state) => state.userConfirmations.dangerousActionState
  );
  const dismiss = useStoreActions(
    (actions) => actions.userConfirmations.dismissDangerousAction
  );
  const invoke = useStoreActions(
    (actions) => actions.userConfirmations.invokeDangerousAction
  );

  if (state.kind === "idle") {
    return null;
  }

  const awaitingAction = state.kind === "performing-action";

  const handleClose = () => dismiss();
  const handleConfirm = () => invoke();

  // TODO: Allow this to be passed in?
  const actionText = "DELETE";

  const content = contentFromDescriptor(state.actionDescriptor);

  return (
    <Modal show={true} centered animation={false} onHide={handleClose}>
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
