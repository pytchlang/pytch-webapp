import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";

// Have to have this logic in the component to keep thunk payload as simple data?
const readArraybuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => resolve(fr.result as ArrayBuffer);
    fr.readAsArrayBuffer(file);
  });
};

const AddAssetModal = () => {
  const fileInputRef: React.RefObject<HTMLInputElement> = React.createRef();
  const modalName = "add-asset";

  const { isShowing } = useStoreState((state) => ({
    isShowing: state.modals.isShowing.get("add-asset"),
  }));
  const { requestAddAsset, hide } = useStoreActions((actions) => ({
    requestAddAsset: actions.activeProject.requestAddAssetAndSync,
    hide: actions.modals.hide,
  }));

  const [haveFile, setHaveFile] = useState(false);

  const handleAdd = async () => {
    // TODO: Should I check for non-null on these rather than "!"?
    const file = fileInputRef.current!.files![0];
    console.log("adding", file);

    const fileBuffer = await readArraybuffer(file);
    console.log("got contents:", fileBuffer.byteLength);

    await requestAddAsset({
      name: file.name,
      mimeType: file.type,
      data: fileBuffer,
    });

    handleClose();
  };

  const handleClose = () => {
    setHaveFile(false); // Clear for next time.
    hide(modalName);
  };

  const handleFileSelection = () => {
    setHaveFile(true);
  };

  return (
    <Modal show={isShowing} onHide={handleClose} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>Add an image or sound</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Choose an image or sound file to add to your project.</p>
        <Form>
          <Form.Group>
            <Form.File ref={fileInputRef} onChange={handleFileSelection} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button disabled={!haveFile} variant="primary" onClick={handleAdd}>
          Add to project
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddAssetModal;
