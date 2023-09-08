import React, { createRef, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { MaybeErrorOrSuccessReport } from "../MaybeErrorOrSuccessReport";
import {
  EventDescriptorKind,
  EventDescriptorKindOps,
} from "../../model/junior/structured-program";
import { submitOnEnterKeyFun } from "../../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { KeyChoiceModal } from "./KeyChoiceModal";
import { useJrEditActions, useJrEditState } from "./hooks";
import classNames from "classnames";

type EventKindOptionProps = React.PropsWithChildren<{
  kind: EventDescriptorKind;
}>;
const EventKindOption: React.FC<EventKindOptionProps> = ({
  kind,
  children,
}) => {
  const chosenKind = useJrEditState(
    (s) => s.upsertHatBlockInteraction.chosenKind
  );
  const setChosenKind = useJrEditActions(
    (a) => a.upsertHatBlockInteraction.setChosenKind
  );

  const chosen = chosenKind === kind;
  const classes = classNames("EventKindOption", { chosen });

  return (
    <li className={classes} onClick={() => setChosenKind(kind)}>
      <div className="bump" />
      {children}
    </li>
  );
};

type KeyEditorProps = {
  displayName: string;
  onEditClick(): void;
};
const KeyEditor: React.FC<KeyEditorProps> = ({ displayName, onEditClick }) => {
  return (
    <div className="KeyEditor">
      <span className="key-button">
        {displayName}
        <span className="edit-button" onClick={onEditClick}>
          <FontAwesomeIcon icon="pencil-alt"></FontAwesomeIcon>
        </span>
      </span>
    </div>
  );
};

export const UpsertHandlerModal = () => {
  const {
    mode,
    upsertionDescriptor,
    keyIfChosen,
    messageIfChosen,
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    inputsReady,
  } = useJrEditState((s) => s.upsertHatBlockInteraction);

  const {
    setMode,
    setKeyIfChosen,
    setMessageIfChosen,
    refreshInputsReady,
    attempt,
    dismiss,
  } = useJrEditActions((a) => a.upsertHatBlockInteraction);

  const ulRef: React.RefObject<HTMLUListElement> = createRef();

  const chosenKind = upsertionDescriptor.eventDescriptor.kind;
  useEffect(() => {
    if (
      mode === "choosing-hat-block" &&
      ulRef.current != null &&
      EventDescriptorKindOps.arity(chosenKind) === 0
    ) {
      ulRef.current.focus();
    }
  }, [mode, ulRef, chosenKind]);

  const handleClose = () => dismiss();
  const handleUpsert = () => attempt(upsertionDescriptor);
  const handleKeyDown = submitOnEnterKeyFun(handleUpsert, inputsReady);

  const successMessage =
    upsertionDescriptor.action.kind === "insert" ? "Added!" : "Updated!";

  if (mode === "choosing-key") {
    return (
      <KeyChoiceModal
        startingKey={keyIfChosen}
        onCancel={() => setMode("choosing-hat-block")}
        onAccept={(key) => {
          setKeyIfChosen(key);
          setMode("choosing-hat-block");
        }}
      />
    );
  }

  return (
    <Modal
      className="UpsertHandlerModal"
      show={isActive}
      onHide={handleClose}
      animation={false}
      centered
    >
      <Modal.Header closeButton={isInteractable}>
        <Modal.Title>Choose hat block</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <ul tabIndex={-1} onKeyDown={handleKeyDown} ref={ulRef}>
          </ul>
        </Form>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess={successMessage}
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
          onClick={handleUpsert}
        >
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
