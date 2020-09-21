import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";

export const RenameAssetModal = () => {
  const [name, setName] = useState("");
  const activeRename = useStoreState(
    (state) => state.userConfirmations.activeRenameAsset
  );
  const { dismissRename, doRename } = useStoreActions((actions) => ({
    dismissRename: actions.userConfirmations.dismissRenameAsset,
    doRename: actions.userConfirmations.doRenameAsset,
  }));

  const onClose = () => {
    dismissRename();
  };

  const onRename = () => {
    if (activeRename == null) {
      throw Error("cannot do rename if no activeRenameAsset");
    }
    doRename({
      oldName: activeRename.oldName,
      newName: name,
    });
  };

  return (
    <Modal
      show={activeRename != null}
      onHide={onClose}
      animation={false}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Rename "{activeRename?.oldName}"</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Control
            type="text"
            value={name}
            onChange={(evt) => setName(evt.target.value)}
          ></Form.Control>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onRename}>
          Rename
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
