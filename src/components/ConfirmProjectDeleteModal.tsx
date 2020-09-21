import React from "react";
import Modal from "react-bootstrap/Modal";
import { IDeleteProjectDescriptor } from "../model/ui";

export const ConfirmProjectDeleteModal = (
  descriptor: IDeleteProjectDescriptor
) => {
  return {
    header: <Modal.Title>Delete project?</Modal.Title>,
    body: (
      <>
        <p>
          Are you sure you want to delete project{" "}
          <strong>{descriptor.projectName}</strong>?
        </p>
      </>
    ),
  };
};
