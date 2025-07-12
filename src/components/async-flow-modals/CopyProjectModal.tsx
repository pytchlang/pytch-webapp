import React, { ChangeEvent, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { MaybeErrorOrSuccessReport } from "../MaybeErrorOrSuccessReport";
import { submitOnEnterKeyFun } from "../../utils";
import {
  flowFocusOrBlurFun,
  isInteractable,
  isSucceeded,
  maybeLastFailureMessage,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { asyncFlowModal } from "../async-flow-modals/utils";
import { useFlowActions, useFlowState } from "../../model";

export const CopyProjectModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.saveProjectAsFlow);
  const { setNameOfCopy } = useFlowActions((f) => f.saveProjectAsFlow);

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(flowFocusOrBlurFun(inputRef, fsmState));

  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { nameOfCopy } = activeFsmState.runState;
    const settle = settleFunctions(isSubmittable, activeFsmState);

    const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
      setNameOfCopy(evt.target.value);
    };
    const handleKeyPress = submitOnEnterKeyFun(settle.submit, isSubmittable);

    return (
      <Modal
        className="CopyProject"
        show={true}
        onHide={settle.cancel}
        animation={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>Copy project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Control
                readOnly={!isInteractable(activeFsmState)}
                type="text"
                value={nameOfCopy}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                placeholder="Name for copy of project"
                tabIndex={-1}
                ref={inputRef}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={settle.cancel}
            disabled={!isInteractable}
          >
            Cancel
          </Button>
          <Button
            disabled={!isSubmittable}
            variant="primary"
            onClick={settle.submit}
          >
            Make a copy
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};
