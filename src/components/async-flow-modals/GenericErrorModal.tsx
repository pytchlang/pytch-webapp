import React from "react";
import { Button } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";

type GenericErrorModalProps = {
  message: string;
  onAck: () => void;
};

export const GenericErrorModal: React.FC<GenericErrorModalProps> = ({
  message,
  onAck,
}) => {
  return (
    <Modal className="GenericErrorModal" show={true} animation={false} centered>
      <Modal.Header>
        <Modal.Title>Unexpected error</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Sorry, there was an unexpected problem. Please contact the Pytch team
          if the problem persists.
        </p>
        <p>
          (Technical details: <span className="error-message">{message}</span>)
        </p>
        <div className="d-flex justify-content-end">
          <Button onClick={onAck}>OK</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
