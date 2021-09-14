import React from "react";
import Modal from "react-bootstrap/Modal";
import { FileProcessingFailure } from "../model/user-interactions/process-files";

export const FileProcessingFailures: React.FC<{
  titleText: string;
  introText: string;
  failures: Array<FileProcessingFailure>;
  dismiss: () => void;
}> = (props) => {
  const failureEntries = props.failures.map((failure) => (
    <li key={failure.fileName}>
      <code>{failure.fileName}</code> — {failure.reason}
    </li>
  ));

  return (
    <Modal show={true} animation={false} className="add-asset-failures">
      <Modal.Header closeButton={true} onHide={() => props.dismiss()}>
        <Modal.Title>{props.titleText}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{props.introText}</p>
        <ul>{failureEntries}</ul>
        <p>Please check the files and try again.</p>
      </Modal.Body>
    </Modal>
  );
};
