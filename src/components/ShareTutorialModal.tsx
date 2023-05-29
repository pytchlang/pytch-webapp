import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useStoreActions, useStoreState } from "../store";
import { sharingUrlFromSlug } from "../model/user-interactions/share-tutorial";

export const ShareTutorialModal = () => {
  const { isActive, slug, displayName } = useStoreState(
    (state) => state.userConfirmations.shareTutorialInteraction
  );

  const { dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.shareTutorialInteraction
  );

  const handleClose = () => dismiss();

  return (
    <Modal
      className="ShareTutorial"
      size="lg"
      show={isActive}
      onHide={dismiss}
      animation={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>Share project "<strong>{displayName}</strong>" </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>TODO: screenshot</p>
        <p>TODO: copy button</p>
        <p>{sharingUrlFromSlug(slug)}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};