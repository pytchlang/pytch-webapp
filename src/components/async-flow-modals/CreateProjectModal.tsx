import React from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import { submitOnEnterKeyFun } from "../../utils";
import { RadioButtonOption } from "../RadioButtonOption";

import { PytchProgramKind } from "../../model/pytch-program-types";
import { WhetherExampleTag } from "../../model/project-templates";

import FlatEditorThumbnail from "../../images/flat.png";
import PerMethodEditorThumbnail from "../../images/per-method.png";
import { asyncFlowModal } from "../async-flow-modals/utils";
import {
  focusOrBlurElementFun,
  isActive,
  isInteractable,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { useFlowActions, useFlowState } from "../../model";
import {Col, Container, Row} from "react-bootstrap";

const WhetherExampleOption = RadioButtonOption<WhetherExampleTag>;
const EditorKindOption = RadioButtonOption<PytchProgramKind>;

export const CreateProjectModal = () => {
  const { t } = useTranslation("projects");
  const { t: tCommon } = useTranslation("common");
  const { fsmState, isSubmittable } = useFlowState((f) => f.createProjectFlow);

  const { setEditorKind, setWhetherExample, setName, setCloudStored } = useFlowActions(
    (f) => f.createProjectFlow
  );

  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { name, editorKind, whetherExample } = activeFsmState.runState;
    const settle = settleFunctions(isSubmittable, activeFsmState);

    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
      setName(evt.target.value);
    };

    const handleChangeCloudStored = (evt: React.ChangeEvent<HTMLInputElement>) => {
      console.log('updating cloud stored to', evt.target.value);
      setCloudStored(evt.target.value === "on");
    };

    const handleKeyPress = submitOnEnterKeyFun(settle.submit, isSubmittable);

    const editorKindThumbnail =
      editorKind === "flat" ? FlatEditorThumbnail : PerMethodEditorThumbnail;

    const editingModeContent = (
      <>
        <hr />
        <Form.Group className="editor-kind">
          <Form.Label>Editor kind</Form.Label>
          <div className="option-buttons">
            <EditorKindOption
              thisOption="per-method"
              activeOption={editorKind}
              label={t("create.kind.per-method")}
              setActive={setEditorKind}
            />
            <EditorKindOption
              thisOption="flat"
              activeOption={editorKind}
              label={t("create.kind.flat")}
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
          <Modal.Title>{t("create.title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col>
                <Form>
                  <Form.Group>
                    <Form.Label>Project title</Form.Label>
                    <Form.Control
                        readOnly={!isInteractable(activeFsmState)}
                        type="text"
                        value={name}
                        onChange={handleChange}
                        onKeyDown={handleKeyPress}
                        placeholder={t("create.name-placeholder")}
                        tabIndex={-1}
                        ref={focusOrBlurElementFun(fsmState)}
                    />
                  </Form.Group>
                  <hr />
                  <Form.Group className="whether-include-example">
                    <Form.Label>Example code</Form.Label>
                    <div className="option-buttons">
                      <WhetherExampleOption
                          thisOption="without-example"
                          activeOption={whetherExample}
                          label={t("create.example-code.no")}
                          setActive={setWhetherExample}
                      />
                      <WhetherExampleOption
                          thisOption="with-example"
                          activeOption={whetherExample}
                          label={t("create.example-code.yes")}
                          setActive={setWhetherExample}
                      />
                    </div>
                  </Form.Group>
                  {editingModeContent}
                  <hr />
                  <Form.Check
                      type="switch"
                      id="custom-switch"
                      label="Save project automatically to cloud"
                      default={true}
                      onChange={handleChangeCloudStored}
                      disabled={!sessionStorage.getItem("access_token")}
                  />
                </Form>
              </Col>
            </Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={settle.cancel}
            disabled={!isInteractable}
          >
            {tCommon("button.cancel")}
          </Button>
          <Button
            disabled={!isSubmittable}
            variant="primary"
            onClick={settle.submit}
          >
            {t("create.button.create-project")}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};

export default CreateProjectModal;
