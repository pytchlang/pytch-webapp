import React, { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import { useStoreActions, useStoreState } from "../store";
import { focusOrBlurFun, submitOnEnterKeyFun } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

import {
  templateKindFromComponents,
} from "../model/project-templates";

export const CreateProjectModal = () => {
  const {
    isActive,
    inputsReady,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    name,
    whetherExample,
    editorKind,
  } = useStoreState(
    (state) => state.userConfirmations.createProjectInteraction
  );

  const {
    dismiss,
    attempt,
    setName,
    setWhetherExample,
    setEditorKind,
    refreshInputsReady,
  } = useStoreActions(
    (actions) => actions.userConfirmations.createProjectInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const handleCreate = () =>
    attempt({
      name,
      template: templateKindFromComponents(whetherExample, editorKind),
    });

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setName(evt.target.value);
    refreshInputsReady();
  };

  const handleClose = () => dismiss();

  const handleKeyPress = submitOnEnterKeyFun(handleCreate, inputsReady);

  return (
    <Modal show={isActive} onHide={handleClose} animation={false} size="lg">
      <Modal.Header>
        <Modal.Title>Create a new project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Control
              readOnly={!isInteractable}
              type="text"
              value={name}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder="Name for your new project"
              tabIndex={-1}
              ref={inputRef}
            />
          </Form.Group>
        </Form>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Project created!"
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={!isInteractable}
        >
          Cancel
        </Button>
        <Button
          disabled={!(isInteractable && inputsReady)}
          variant="primary"
          onClick={handleCreate}
        >
          Create project
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateProjectModal;
