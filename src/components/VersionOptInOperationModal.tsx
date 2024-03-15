import React from "react";
import { useStoreState } from "../store";
import Modal from "react-bootstrap/Modal";
import { Spinner } from "react-bootstrap";

export const VersionOptInOperationModal = () => {
  const v2OperationState = useStoreState(
    (state) => state.versionOptIn.v2OperationState
  );

  switch (v2OperationState) {
    case "idle":
      return false;
    case "in-progress":
      return (
        <Modal show={true} size="xl" centered={true} animation={false}>
          <Modal.Header>
            <Modal.Title>Working...</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-5 mx-auto">
            <Spinner animation="border" />
          </Modal.Body>
        </Modal>
      );
  }
};
