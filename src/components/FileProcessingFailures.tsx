import React from "react";
import Modal from "react-bootstrap/Modal";
import { FileProcessingFailure } from "../model/user-interactions/process-files";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const FileProcessingFailures: React.FC<{
  titleText: string;
  introText: string;
  failures: Array<FileProcessingFailure>;
  dismiss: () => void;
}> = (props) => {
  const failureEntries = props.failures.map((failure) => (
    <li key={failure.filename}>
      <code>{failure.filename}</code> — {failure.reason}
    </li>
  ));

  return (
    <Modal
      show={true}
      animation={false}
      className="add-asset-failures"
      onHide={props.dismiss}
    >
      <Modal.Header closeButton={true}>
        <Modal.Title className="d-flex align-items-center">
          <FontAwesomeIcon
            icon="exclamation-circle"
            size="2x"
            className="pe-3"
          />
          {props.titleText}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{props.introText}</p>
        <ul>{failureEntries}</ul>
        <p>Please check the files and try again.</p>

        <div className="d-flex justify-content-end">
          <Button onClick={props.dismiss}>OK</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
