import React from "react";
import { DeleteJuniorSpriteDescriptor } from "../../model/ui";
import Modal from "react-bootstrap/Modal";

export const confirmDeleteSpriteContent = (
  descriptor: DeleteJuniorSpriteDescriptor
) => {
  return {
    header: (
      <Modal.Title>
        Delete <em>{descriptor.spriteDisplayName}</em>?
      </Modal.Title>
    ),
    body: (
      <>
        <p>
          Are you sure you want to delete the sprite “
          {descriptor.spriteDisplayName}” from your project?
        </p>
      </>
    ),
  };
};
