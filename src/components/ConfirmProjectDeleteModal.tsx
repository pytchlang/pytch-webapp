import React from "react";
import Modal from "react-bootstrap/Modal";
import { DeleteProjectDescriptor } from "../model/ui";

export const confirmProjectDeleteModalContent = (
  descriptor: DeleteProjectDescriptor
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
