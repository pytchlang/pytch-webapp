import React from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
import { readArraybuffer } from "../utils";
import { IUploadZipfileDescriptor } from "../model/user-interactions/upload-zipfile";

export const UploadZipfileModal = () => {
  const fileInputRef: React.RefObject<HTMLInputElement> = React.createRef();

  const {
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    inputsReady,
  } = useStoreState(
    (state) => state.userConfirmations.uploadZipfileInteraction
  );

  const { attempt, dismiss, setInputsReady } = useStoreActions(
    (actions) => actions.userConfirmations.uploadZipfileInteraction
  );

  // TODO: Can some of this logic move to the model from the component?
  // E.g., is it necessary to load the file contents here?  Maybe it's
  // OK to have a complex object (the File) as part of the descriptor?
  // See also AddAssetModal.
  //
  const handleUpload = async () => {
    // TODO: Should I check for non-null on these rather than "!"?
    const file = fileInputRef.current!.files![0];
    const fileBuffer = await readArraybuffer(file);

    fileInputRef.current!.value = "";
    setInputsReady(false);

    const addDescriptor: IUploadZipfileDescriptor = {
      zipName: file.name,
      zipData: fileBuffer,
    };

    attempt(addDescriptor);
  };

  const handleClose = () => dismiss();

  // TODO: Is this always correct?  If the user presses "choose file"
  // then cancels from the resulting native file-chooser?
  const handleFileSelection = () => setInputsReady(true);

  return (
    <Modal show={isActive} onHide={handleClose} animation={false}>
      <Modal.Header closeButton={isInteractable}>
        <Modal.Title>Upload a project zipfile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Choose a Pytch zipfile to create a project from.</p>
        <Form>
          <Form.Group>
            <Form.File ref={fileInputRef} onChange={handleFileSelection} />
          </Form.Group>
        </Form>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Uploaded!"
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={!isInteractable}
          variant="secondary"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          disabled={!(isInteractable && inputsReady)}
          variant="primary"
          onClick={handleUpload}
        >
          Upload project
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
