import React from "react";
import Modal from "react-bootstrap/Modal";
import { DeleteAssetFromProjectDescriptor } from "../model/ui";

export const confirmAssetDeleteModalContent = (
  descriptor: DeleteAssetFromProjectDescriptor
) => {
  return {
    header: (
      <Modal.Title>
        Delete {descriptor.assetKind} “{descriptor.assetName}” from project?
      </Modal.Title>
    ),
    body: (
      <>
        <p>
          Are you sure you want to delete the {descriptor.assetKind} “
          {descriptor.assetName}” from your project?
        </p>
      </>
    ),
  };
};
