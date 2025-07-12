import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { CompoundTextInput } from "../CompoundTextInput";
import {
  flowFocusOrBlurFun,
  isInteractable,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { asyncFlowModal } from "./utils";
import { useFlowActions, useFlowState } from "../../model";

export const DownloadZipfileModal = () => {
  const { fsmState, isSubmittable } = useFlowState(
    (f) => f.downloadZipfileFlow
  );
  const { setUiFragmentValue } = useFlowActions((f) => f.downloadZipfileFlow);

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(flowFocusOrBlurFun(inputRef, fsmState));

  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { formatSpecifier } = activeFsmState.runState;
    const settle = settleFunctions(isSubmittable, activeFsmState);

    return (
      <Modal
        className="DownloadZipfile"
        show={true}
        onHide={settle.cancel}
        animation={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>Download zipfile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="icon-container">
            <FontAwesomeIcon className="fa-4x" icon="file-archive" />
          </div>

          <CompoundTextInput
            formatSpecifier={formatSpecifier}
            onNewUiFragmentValue={setUiFragmentValue}
            onEnterKey={settle.submit}
            ref={inputRef}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={!isInteractable(activeFsmState)}
            variant="secondary"
            onClick={settle.cancel}
          >
            Cancel
          </Button>
          <Button
            disabled={!isSubmittable}
            variant="primary"
            onClick={settle.submit}
          >
            Download
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};
