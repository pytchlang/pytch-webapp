import React from "react";
import Modal from "react-bootstrap/Modal";
import { IDeleteAssetFromProjectDescriptor } from "../model/ui";

export const ConfirmAssetDeleteModal = (
  descriptor: IDeleteAssetFromProjectDescriptor
) => {
  return {
    header: (
      <Modal.Title>
        Delete {descriptor.assetKind} "{descriptor.assetName}" from project?
      </Modal.Title>
    ),
    body: (
      <>
        <p>
          Are you sure you want to delete the {descriptor.assetKind} "
          {descriptor.assetName}" from your project?
        </p>
      </>
    ),
  };
};
