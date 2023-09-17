import React from "react";
import Modal from "react-bootstrap/Modal";
import { DeleteManyProjectsDescriptor } from "../model/ui";

export const confirmDeleteManyProjectsModalContent = (
  descriptor: DeleteManyProjectsDescriptor
) => {
  const nProjects = descriptor.projectIds.length;
  const plural = nProjects > 1;
  const noun = plural ? "projects" : "project";

  return {
    header: <Modal.Title>Delete {noun}?</Modal.Title>,
    body: (
      <>
        <p>
          Are you sure you want to delete {nProjects} {noun}?
        </p>
      </>
    ),
  };
};
