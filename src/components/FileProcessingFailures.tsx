import React from "react";
import Modal from "react-bootstrap/Modal";
import { Failure } from "../model/user-interactions/add-assets";

export const FileProcessingFailures: React.FC<{ failures: Array<Failure> }> = (
  props
) => {
  const dismiss = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction.dismiss
  );

  const failureEntries = props.failures.map((failure) => (
    <li key={failure.fileName}>
      <code>{failure.fileName}</code> — {failure.reason}
    </li>
  ));

  return (
    <Modal show={true} animation={false} className="add-asset-failures">
      <Modal.Header closeButton={true} onHide={() => dismiss()}>
        <Modal.Title>Problem adding images or sounds</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Sorry, there was a problem adding files to your project:</p>
        <ul>{failureEntries}</ul>
        <p>Please check the files and try again.</p>
      </Modal.Body>
    </Modal>
  );
};
