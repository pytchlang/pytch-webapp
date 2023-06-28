import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useStoreActions, useStoreState } from "../store";
import { sharingUrlFromSlug, sharingUrlFromSlugForDemo } from "../model/user-interactions/share-tutorial";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

        <p>Copy the link to share the <strong>tutorial</strong>:</p>
        
        <div 
          className="CopyLinkDiv"
        >
          <Button
            className="copy-button"
            variant="outline-success"
            onClick={() => {
              navigator.clipboard.writeText(sharingUrlFromSlug(slug));
            }}
          > Copy
            <FontAwesomeIcon style={{marginLeft : "10px"}} className="fa-lg" icon="copy" />
          </Button>
          <label>{sharingUrlFromSlug(slug)}</label>
        </div>
        <p>Copy the link to share the <strong>tutorial with demo</strong>:</p>
        <div
          className="CopyLinkDiv"
        >
          <Button
            className="copy-button"
            variant="outline-success"
            onClick={() => {
              navigator.clipboard.writeText(sharingUrlFromSlugForDemo(slug));
            }}
          > Copy
            <FontAwesomeIcon style={{marginLeft : "10px"}} className="fa-lg" icon="copy" />
          </Button>
          <label>{sharingUrlFromSlugForDemo(slug)}</label>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};