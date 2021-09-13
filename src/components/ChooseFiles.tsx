import React from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useState } from "react";
import Spinner from "react-bootstrap/Spinner";

export const ChooseFiles: React.FC<{
  titleText: string;
  introText: string;
  actionButtonText: string;
  status: "awaiting-user-choice" | "trying-to-process";
  tryProcess: (files: FileList) => void;
  dismiss: () => void;
}> = (props) => {
  const [filesChosen, setFilesChosen] = useState(false);

  const isAwaiting = props.status === "awaiting-user-choice";
  const isTrying = props.status === "trying-to-process";

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
      console.warn("trying to process empty list of files");
      return;
    }
    props.tryProcess(files);
  };

  const modalContent = (
    <>
      <Modal.Body>
        <p>{props.introText}</p>
        <Form>
          <Form.File
            ref={fileInputRef}
            multiple={true}
            onChange={handleFileSelection}
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => props.dismiss()}>
          Cancel
        </Button>
        <Button disabled={!filesChosen} variant="primary" onClick={handleAdd}>
          {props.actionButtonText}
        </Button>
      </Modal.Footer>
    </>
  );

  return (
    <Modal
      className="add-assets"
      show={true}
      onHide={() => props.dismiss()}
      animation={false}
    >
      <Modal.Header closeButton={isAwaiting}>
        <Modal.Title>{props.titleText}</Modal.Title>
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
