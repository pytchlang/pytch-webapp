import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { MaybeErrorOrSuccessReport } from "../MaybeErrorOrSuccessReport";
import { Form } from "react-bootstrap";
import {
  assertNever,
  focusOrBlurFun,
  onChangeFun,
  submitOnEnterKeyFun,
} from "../../utils";
import { useJrEditActions, useJrEditState } from "./hooks";

export const UpsertSpriteModal = () => {
  const {
    upsertionArgs,
    nameValidity,
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    inputsReady,
  } = useJrEditState((s) => s.upsertSpriteInteraction);

  const { setName, attempt, dismiss } = useJrEditActions(
    (a) => a.upsertSpriteInteraction
  );

  const handleNameChange = onChangeFun(setName);

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const handleClose = () => dismiss();
  const handleCommit = () => attempt(upsertionArgs);
  const handleKeyPress = submitOnEnterKeyFun(handleCommit, inputsReady);

  const validityContent = (() => {
    switch (nameValidity.status) {
      case "valid":
        // Even though this won't be shown, we need some content for the
        // <P> to have non-zero height:
        return <p>OK</p>;
      case "invalid":
        return <p>That name cannot be used, because {nameValidity.reason}.</p>;
      default:
        return assertNever(nameValidity);
    }
  })();

  const content = (() => {
    switch (upsertionArgs.kind) {
      case "insert":
        return {
          title: <span>Create new sprite</span>,
          messageWhenSuccess: "Created!",
        };
      case "update":
        return {
          title: (
            <span>
              Rename <em>{upsertionArgs.previousName}</em>
            </span>
          ),
          messageWhenSuccess: "Renamed!",
        };
      default:
        return assertNever(upsertionArgs);
    }
  })();

  return (
    <Modal
      className="UpsertSpriteModal"
      show={isActive}
      onHide={handleClose}
      animation={false}
      centered
    >
      <Modal.Header closeButton={isInteractable}>
        <Modal.Title>{content.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Control
            type="text"
            value={upsertionArgs.name}
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
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={!isInteractable}
          variant="secondary"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          disabled={!(isInteractable && inputsReady)}
          variant="primary"
          onClick={handleCommit}
        >
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};