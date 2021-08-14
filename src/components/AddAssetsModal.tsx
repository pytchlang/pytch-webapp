import React from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { Failure } from "../model/user-interactions/add-assets";
import { useState } from "react";
import Spinner from "react-bootstrap/Spinner";

const ChooseFiles: React.FC<{
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

const AdditionFailures: React.FC<{ failures: Array<Failure> }> = (props) => {
  const dismiss = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction.dismiss
  );

  const failureEntries = props.failures.map((failure) => (
    <li key={failure.fileName}>
      <code>{failure.fileName}</code> — {failure.reason}
    </li>
  ));

  return (
    <Modal show={true} animation={false} className="add-asset-failures">
      <Modal.Header closeButton={true} onHide={() => dismiss()}>
        <Modal.Title>Problem adding images or sounds</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Sorry, there was a problem adding files to your project:</p>
        <ul>{failureEntries}</ul>
        <p>Please check the files and try again.</p>
      </Modal.Body>
    </Modal>
  );
};

export const AddAssetsModal = () => {
};
