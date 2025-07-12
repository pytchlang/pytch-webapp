import React, { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import { submitOnEnterKeyFun } from "../../utils";
import { RadioButtonOption } from "../RadioButtonOption";

import { PytchProgramKind } from "../../model/pytch-program";
import { WhetherExampleTag } from "../../model/project-templates";

import FlatEditorThumbnail from "../../images/flat.png";
import PerMethodEditorThumbnail from "../../images/per-method.png";
import { asyncFlowModal } from "../async-flow-modals/utils";
import {
  flowFocusOrBlurFun,
  isActive,
  isInteractable,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { useFlowActions, useFlowState } from "../../model";

const WhetherExampleOption = RadioButtonOption<WhetherExampleTag>;
const EditorKindOption = RadioButtonOption<PytchProgramKind>;

export const CreateProjectModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.createProjectFlow);

  const { setEditorKind, setWhetherExample, setName } = useFlowActions(
    (f) => f.createProjectFlow
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(flowFocusOrBlurFun(inputRef, fsmState));

  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { name, editorKind, whetherExample } = activeFsmState.runState;
    const settle = settleFunctions(isSubmittable, activeFsmState);

    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
      setName(evt.target.value);
    };

    const handleKeyPress = submitOnEnterKeyFun(settle.submit, isSubmittable);

    const editorKindThumbnail =
      editorKind === "flat" ? FlatEditorThumbnail : PerMethodEditorThumbnail;

    const editingModeContent = (
      <>
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
      </>
    );

    return (
      <Modal
        className="CreateProjectModal"
        show={isActive(activeFsmState)}
        onHide={settle.cancel}
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
                readOnly={!isInteractable(activeFsmState)}
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
            {editingModeContent}
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
            Create project
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};

export default CreateProjectModal;
