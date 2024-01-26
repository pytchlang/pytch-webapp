import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useStoreActions, useStoreState } from "../store";
import {
  sharingUrlFromSlug,
  sharingUrlFromSlugForDemo,
} from "../model/user-interactions/share-tutorial";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { copyTextToClipboard } from "../utils";

export const ShareTutorialModal = () => {
  const { isActive, info } = useStoreState(
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
        <Modal.Title>
          Share project “<strong>{info.displayName}</strong>”
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Copy the link to share the project only with the{" "}
          <strong>tutorial</strong> button:
        </p>

        <div className="CopyLinkDiv">
          <Button
            title="Copy link to tutorial only"
            className="copy-button"
            variant="outline-success"
            onClick={() => {
              copyTextToClipboard(sharingUrlFromSlug(info.slug));
            }}
          >
            Copy
            <FontAwesomeIcon
              style={{ marginLeft: "10px" }}
              className="fa-lg"
              icon="copy"
            />
          </Button>
          <label>{sharingUrlFromSlug(info.slug)}</label>
        </div>
        <p>
          Copy the link to share the project with the{" "}
          <strong>tutorial and demo</strong> buttons:
        </p>
        <div className="CopyLinkDiv">
          <Button
            title="Copy link to tutorial and demo"
            className="copy-button"
            variant="outline-success"
            onClick={() => {
              copyTextToClipboard(sharingUrlFromSlugForDemo(info.slug));
            }}
          >
            Copy
            <FontAwesomeIcon
              style={{ marginLeft: "10px" }}
              className="fa-lg"
              icon="copy"
            />
          </Button>
          <label>{sharingUrlFromSlugForDemo(info.slug)}</label>
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
