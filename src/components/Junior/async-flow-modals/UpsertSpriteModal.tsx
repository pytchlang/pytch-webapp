import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { MaybeErrorOrSuccessReport } from "../../MaybeErrorOrSuccessReport";
import { Form } from "react-bootstrap";
import { assertNever, onChangeFun, submitOnEnterKeyFun } from "../../../utils";
import { useJrEditActions, useJrEditState } from "../hooks";
import {
  flowFocusOrBlurFun,
  isInteractable,
  isSucceeded,
  maybeLastFailureMessage,
  settleFunctions,
} from "../../../model/user-interactions/async-user-flow";
import { asyncFlowModal } from "../../async-flow-modals/utils";

export const UpsertSpriteModal = () => {
  const { fsmState, isSubmittable } = useJrEditState((s) => s.upsertSpriteFlow);
  const { setName } = useJrEditActions((a) => a.upsertSpriteFlow);

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(flowFocusOrBlurFun(inputRef, fsmState));

  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { upsertionAction, name, nameValidity } = activeFsmState.runState;
    const handleNameChange = onChangeFun(setName);
    const settle = settleFunctions(isSubmittable, activeFsmState);
    const handleKeyPress = submitOnEnterKeyFun(settle.submit, isSubmittable);

    const validityContent = (() => {
      switch (nameValidity.status) {
        case "valid":
          // Even though this won't be shown, we need some content for the
          // <P> to have non-zero height:
          return <p>OK</p>;
        case "invalid":
          return (
            <p>That name cannot be used, because {nameValidity.reason}.</p>
          );
        default:
          return assertNever(nameValidity);
      }
    })();

    const content = (() => {
      switch (upsertionAction.kind) {
        case "insert":
          return {
            title: <span>Create new sprite</span>,
            messageWhenSuccess: "Created!",
          };
        case "update":
          return {
            title: (
              <span>
                Rename <em>{upsertionAction.previousName}</em>
              </span>
            ),
            messageWhenSuccess: "Renamed!",
          };
        default:
          return assertNever(upsertionAction);
      }
    })();

    // Disable `restoreFocus` behaviour; we use `onDispose()` to manage
    // ourselves where the focus goes after the modal dialog goes away.
    // See code in `ActorsList` (for add=insert) and in
    // `RenameSpriteDropdownItem` (for rename=update).
    return (
      <Modal
        className="UpsertSpriteModal"
        show={true}
        onHide={settle.cancel}
        animation={false}
        restoreFocus={false}
        centered
      >
        <Modal.Header closeButton={isInteractable(activeFsmState)}>
          <Modal.Title>{content.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Control
              type="text"
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleKeyPress}
              tabIndex={-1}
              ref={inputRef}
            ></Form.Control>
          </Form>
          <Alert
            variant="danger"
            className={`validity-assessment ${nameValidity.status}`}
          >
            {validityContent}
          </Alert>
          <MaybeErrorOrSuccessReport
            messageWhenSuccess={content.messageWhenSuccess}
            attemptSucceeded={isSucceeded(activeFsmState)}
            maybeLastFailureMessage={maybeLastFailureMessage(activeFsmState)}
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
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};
