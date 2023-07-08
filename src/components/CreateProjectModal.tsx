import React, { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import { useStoreActions, useStoreState } from "../store";
import { focusOrBlurFun, submitOnEnterKeyFun } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
import { ProjectTemplateKind } from "../model/projects";

type TemplateChoiceButtonProps = {
  currentTemplate: ProjectTemplateKind;
  newTemplate: ProjectTemplateKind;
  label: string;
  handleTemplateChange: (newTemplate: ProjectTemplateKind) => void;
};

const TemplateChoiceButton: React.FC<TemplateChoiceButtonProps> = (props) => {
  const isCurrent = props.newTemplate === props.currentTemplate;
  const variantPrefix = isCurrent ? "" : "outline-";
  const variant = `${variantPrefix}success`;

  // The data-template-slug is mostly for test support, to allow tests
  // to find a desired button by kind-slug rather than label.
  return (
    <Button
      data-template-slug={props.newTemplate}
      variant={variant}
      onClick={() => props.handleTemplateChange(props.newTemplate)}
    >
      {props.label}
    </Button>
  );
};

export const CreateProjectModal = () => {
  const {
    isActive,
    inputsReady,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    name,
    template,
  } = useStoreState(
    (state) => state.userConfirmations.createProjectInteraction
  );

  const {
    dismiss,
    attempt,
    setName,
    setTemplate,
    refreshInputsReady,
  } = useStoreActions(
    (actions) => actions.userConfirmations.createProjectInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const handleCreate = () => attempt({ name, template });

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setName(evt.target.value);
    refreshInputsReady();
  };

  const handleTemplateChange = (newTemplate: ProjectTemplateKind) => {
    setTemplate(newTemplate);
    // Actually unnecessary because template is always valid, but for
    // completeness:
    refreshInputsReady();
  };

  const handleClose = () => dismiss();

  const handleKeyPress = submitOnEnterKeyFun(handleCreate, inputsReady);

  return (
    <Modal show={isActive} onHide={handleClose} animation={false}>
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
          <Form.Group className="project-template-buttons">
            <TemplateChoiceButton
              currentTemplate={template}
              newTemplate="bare-bones"
              label="Without example code"
              handleTemplateChange={handleTemplateChange}
            />
            <TemplateChoiceButton
              currentTemplate={template}
              newTemplate="with-sample-code"
              label="With example code"
              handleTemplateChange={handleTemplateChange}
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
