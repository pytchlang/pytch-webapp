import React, { ChangeEvent, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { submitOnEnterKeyFun } from "../../utils";
import { asyncFlowModal } from "./utils";
import {
  flowFocusOrBlurFun,
  isInteractable,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { useFlowActions, useFlowState } from "../../model";

export const RenameProjectModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.renameProjectFlow);
  const { setNewName } = useFlowActions((f) => f.renameProjectFlow);

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(flowFocusOrBlurFun(inputRef, fsmState));

  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { oldName, newName } = activeFsmState.runState;
    const settle = settleFunctions(isSubmittable, activeFsmState);

    const handleKeyPress = submitOnEnterKeyFun(settle.submit, isSubmittable);

    const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
      setNewName(evt.target.value);
    };

    // onChange= set "user has modified suggestion" bit?

    return (
      <Modal show={true} onHide={settle.cancel} animation={false} centered>
        <Modal.Header closeButton={isInteractable(activeFsmState)}>
          <Modal.Title>Rename project “{oldName}”</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Control
              type="text"
              value={newName}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              tabIndex={-1}
              ref={inputRef}
            ></Form.Control>
          </Form>
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
            Rename
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};
