import React from "react";
import Modal from "react-bootstrap/Modal";
import { DeleteAssetFromProjectDescriptor } from "../model/ui";

export const confirmAssetDeleteModalContent = (
  descriptor: DeleteAssetFromProjectDescriptor
) => {
  return {
    header: (
      <Modal.Title>
        Delete {descriptor.assetKindDisplayName} “{descriptor.assetDisplayName}”
        from project?
      </Modal.Title>
    ),
    body: (
      <>
        <p>
          Are you sure you want to delete the {descriptor.assetKindDisplayName}{" "}
          “{descriptor.assetDisplayName}” from your project?
        </p>
      </>
    ),
  };
};
