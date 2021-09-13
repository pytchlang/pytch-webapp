import React from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useState } from "react";
import Spinner from "react-bootstrap/Spinner";

export const ChooseFiles: React.FC<{
  status: "awaiting-user-choice" | "trying-to-add";
}> = (props) => {
  const { tryAdd, dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction
  );

  const [filesChosen, setFilesChosen] = useState(false);

  const isAwaiting = props.status === "awaiting-user-choice";
  const isTrying = props.status === "trying-to-add";

  const spinnerExtraClass = isTrying ? "shown" : "hidden";
  const modalContentClass = isAwaiting ? "shown" : "hidden";

  const fileInputRef: React.RefObject<HTMLInputElement> = React.createRef();

  const handleFileSelection = () => {
    const files = fileInputRef.current!.files!;
    setFilesChosen(files.length > 0);
  };

  const handleAdd = () => {
    const files = fileInputRef.current!.files!;
    if (files.length === 0) {
      console.warn("trying to add empty list of files");
      return;
    }
    tryAdd(files);
  };

  const modalContent = (
    <>
      <Modal.Body>
        <p>Choose image or sound files to add to your project.</p>
        <Form>
          <Form.File
            ref={fileInputRef}
            multiple={true}
            onChange={handleFileSelection}
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => dismiss()}>
          Cancel
        </Button>
        <Button disabled={!filesChosen} variant="primary" onClick={handleAdd}>
          Add to project
        </Button>
      </Modal.Footer>
    </>
  );

  return (
    <Modal
      className="add-assets"
      show={true}
      onHide={() => dismiss()}
      animation={false}
    >
      <Modal.Header closeButton={isAwaiting}>
        <Modal.Title>Add images or sounds</Modal.Title>
      </Modal.Header>
      <div className="body-container">
        <div className={`spinner-container ${spinnerExtraClass}`}>
          <Spinner animation="border" />
        </div>
        <div className={modalContentClass}>{modalContent}</div>
      </div>
    </Modal>
  );
};
