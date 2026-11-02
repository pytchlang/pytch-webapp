import React, { ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { assertNever, submitOnEnterKeyFun } from "../../utils";
import {
  isInteractable,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { asyncFlowModal } from "../async-flow-modals/utils";
import { useFlowActions, useFlowState } from "../../model";
import { SaveProjectAsRunState } from "../../model/user-interactions/save-project-as";
import { LinkedContentRef } from "../../model/linked-content-core";
import { TwoStateSwitch, TwoStateSwitchI18nSpec } from "../TwoStateSwitch";

function specForKeepLink(ref: LinkedContentRef): TwoStateSwitchI18nSpec {
  const params = (() => {
    switch (ref.kind) {
      case "none":
        // Should not see this.
        return undefined;
      case "jr-tutorial":
      case "flat-tutorial":
        return { tutorialName: ref.name };
      case "specimen":
      case "demo":
        // Would be nice to know which one, but we don't have that info.
        return undefined;
      default:
        return assertNever(ref);
    }
  })();

  // The wording for following a tutorial is the same whether the
  // tutorial is "per-method" or "flat".
  const keyKind = ref.kind === "flat-tutorial" ? "jr-tutorial" : ref.kind;

  return { keyPart: `copy.switch.${keyKind}`, params, ns: "projects" };
}

const MaybeKeepContentLinkSwitch: React.FC<{
  runState: SaveProjectAsRunState;
}> = ({ runState }) => {
  const setKeepLink = useFlowActions(
    (f) => f.saveProjectAsFlow.setCopyKeepsContentLink
  );

  if (runState.sourceLinkedContentRef.kind === "none") {
    return false;
  }

  return (
    <TwoStateSwitch
      className="keep-content-link-switch"
      i18nSpec={specForKeepLink(runState.sourceLinkedContentRef)}
      boolState={runState.copyKeepsContentLink}
      setBoolState={setKeepLink}
    />
  );
};

export const CopyProjectModal = () => {
  const { t } = useTranslation("projects");
  const { t: tCommon } = useTranslation("common");
  const { fsmState, isSubmittable } = useFlowState((f) => f.saveProjectAsFlow);
  const { setNameOfCopy } = useFlowActions((f) => f.saveProjectAsFlow);
  const focusRequiredRef = useRef<boolean>(true);

  if (fsmState.kind === "idle") {
    focusRequiredRef.current = true;
  }

  const maybeFocusTextInput = (elt: HTMLInputElement | null) => {
    if (elt != null && focusRequiredRef.current) {
      setTimeout(() => elt.focus());
      focusRequiredRef.current = false;
    }
  };

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
          <Modal.Title>{t("copy.title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <MaybeKeepContentLinkSwitch runState={activeFsmState.runState} />
          <Form>
            <Form.Group>
              <Form.Control
                readOnly={!isInteractable(activeFsmState)}
                type="text"
                value={nameOfCopy}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                placeholder={t("copy.name-placeholder")}
                ref={maybeFocusTextInput}
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
            {tCommon("button.cancel")}
          </Button>
          <Button
            disabled={!isSubmittable}
            variant="primary"
            onClick={settle.submit}
          >
            {t("copy.button.make-copy")}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};
