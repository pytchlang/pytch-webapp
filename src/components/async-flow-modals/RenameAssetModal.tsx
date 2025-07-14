import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { CompoundTextInput } from "../CompoundTextInput";
import { FormatSpecifier } from "../../model/compound-text-input";
import {
  flowFocusOrBlurFun,
  isInteractable,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { asyncFlowModal } from "./utils";
import { useFlowActions, useFlowState } from "../../model";

export const RenameAssetModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.renameAssetFlow);
  const { setNewStem } = useFlowActions((f) => f.renameAssetFlow);

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(flowFocusOrBlurFun(inputRef, fsmState));

  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { oldStem, fixedSuffix } = activeFsmState.runState;
    const oldBasename = `${oldStem}${fixedSuffix}`;

    switch (activeFsmState.kind) {
      case "awaiting-ack-of-notification": {
        if (activeFsmState.outcomeNub.kind === "success") {
          throw new Error("should not be notifying if successful");
        }

        const dismiss = activeFsmState.userAck;

        return (
          <Modal
            className="RenameAssetModal-failure"
            show={true}
            onHide={dismiss}
            animation={false}
            centered
          >
            <Modal.Header closeButton={true}>
              <Modal.Title>Rename of “{oldBasename}” failed</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>{activeFsmState.outcomeNub.message}</p>
              <div className="d-flex justify-content-end">
                <Button onClick={dismiss}>OK</Button>
              </div>
            </Modal.Body>
          </Modal>
        );
      }

      case "interacting":
      case "attempting": {
        const settle = settleFunctions(isSubmittable, activeFsmState);

        const formatSpecifier: FormatSpecifier = [
          {
            kind: "user-input",
            placeholder: "new filename",
            initialValue: oldStem,
          },
          { kind: "literal", value: fixedSuffix },
        ];

        return (
          <Modal show={true} onHide={settle.cancel} animation={false} centered>
            <Modal.Header closeButton={isInteractable(activeFsmState)}>
              <Modal.Title>Rename “{oldBasename}”</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <CompoundTextInput
                formatSpecifier={formatSpecifier}
                onNewUiFragmentValue={setNewStem}
                onEnterKey={settle.submit}
                ref={inputRef}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                disabled={!isInteractable}
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
                Rename
              </Button>
            </Modal.Footer>
          </Modal>
        );
      }
    }
  });
};
