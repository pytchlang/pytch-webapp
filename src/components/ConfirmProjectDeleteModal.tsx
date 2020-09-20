import React from "react";
import Modal from "react-bootstrap/Modal";
import { IDeleteProjectDescriptor } from "../model/ui";

interface Props {
  descriptor: IDeleteProjectDescriptor;
}

export const ConfirmProjectDeleteModal: React.FC<Props> = ({ descriptor }) => {
  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title>Delete project?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to delete project{" "}
          <strong>{descriptor.projectName}</strong>?
        </p>
      </Modal.Body>
    </>
  );
};
