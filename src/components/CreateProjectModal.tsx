import React, { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import { useStoreActions, useStoreState } from "../store";
import { focusOrBlurFun, submitOnEnterKeyFun } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
import { RadioButtonOption } from "./RadioButtonOption";

import { PytchProgramKind } from "../model/pytch-program";
import {
  WhetherExampleTag,
  templateKindFromComponents,
} from "../model/project-templates";

import FlatEditorThumbnail from "../images/flat.png";
import PerMethodEditorThumbnail from "../images/per-method.png";

const WhetherExampleOption = RadioButtonOption<WhetherExampleTag>;
const EditorKindOption = RadioButtonOption<PytchProgramKind>;

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

  const editorKindThumbnail =
    editorKind === "flat" ? FlatEditorThumbnail : PerMethodEditorThumbnail;

  return (
    <Modal
      className="CreateProjectModal"
      show={isActive}
      onHide={handleClose}
      animation={false}
      size="lg"
    >
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
          <hr />
          <Form.Group className="whether-include-example">
            <div className="option-buttons">
              <WhetherExampleOption
                thisOption="without-example"
                activeOption={whetherExample}
                label="Without example code"
                setActive={setWhetherExample}
              />
              <WhetherExampleOption
                thisOption="with-example"
                activeOption={whetherExample}
                label="With example code"
                setActive={setWhetherExample}
              />
            </div>
          </Form.Group>
          <hr />
          <Form.Group className="editor-kind">
            <div className="option-buttons">
              <EditorKindOption
                thisOption="per-method"
                activeOption={editorKind}
                label="Edit as sprites and scripts"
                setActive={setEditorKind}
              />
              <EditorKindOption
                thisOption="flat"
                activeOption={editorKind}
                label="Edit as one big program"
                setActive={setEditorKind}
              />
            </div>
            <div className="editor-thumbnail">
              <img src={editorKindThumbnail} />
            </div>
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
