import React from "react";
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import { useStoreActions, useStoreState } from "../store";
import RawElement from "./RawElement";

export const CodeDiffHelpModal = () => {
  const { isActive, samples } = useStoreState(
    (state) => state.userConfirmations.codeDiffHelpInteraction
  );

  const { dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.codeDiffHelpInteraction
  );

  const handleClose = () => dismiss();

  return (
    <Modal
      show={isActive}
      onHide={handleClose}
      animation={false}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>What changes should I make to my code?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {samples.unchanged && (
          <Alert variant="secondary">
            <p>Lines like</p>
            <RawElement
              className="patch-container"
              element={samples.unchanged}
            />
            <p>
              <strong>
                help you find the part of your code which needs changing
              </strong>
              . The two numbers (to the left of the vertical divider) show you
              which line it is. The first number is the line in the code as it
              is now, and the second number is the line as it will be after your
              change.
            </p>
          </Alert>
        )}
        {samples.deleted && (
          <Alert variant="secondary">
            <p>Lines like</p>
            <RawElement className="patch-container" element={samples.deleted} />
            <p>
              show you <strong>code you need to delete</strong>. The line
              numbers (to the left of the vertical divider) show you the line
              number which that line has at the moment, before you delete it.
            </p>
          </Alert>
        )}
        {samples.added && (
          <Alert variant="secondary">
            <p>Lines like</p>
            <RawElement className="patch-container" element={samples.added} />
            <p>
              show you <strong>code you need to add</strong>. The line numbers
              (to the left of the vertical divider) show you the line number
              which that line will have once you've added it. You can use the
              COPY button to copy the lines of code ready for pasting.
            </p>
          </Alert>
        )}
        <p>
          Faint "<code>···</code>"s at the start of a line show spaces — type
          these as normal space characters.
        </p>
      </Modal.Body>
    </Modal>
  );
};
