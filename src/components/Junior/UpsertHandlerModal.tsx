import React, { ChangeEvent, createRef, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { MaybeErrorOrSuccessReport } from "../MaybeErrorOrSuccessReport";
import {
  ActorKindOps,
  EventDescriptorKind,
  EventDescriptorKindOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { submitOnEnterKeyFun } from "../../utils";
import { KeyChoiceModal } from "./KeyChoiceModal";
import { useJrEditActions, useJrEditState, useMappedProgram } from "./hooks";
import classNames from "classnames";

// TODO: Is this unduly restrictive?  I think we should end up with a
// valid Python string literal if we forbid the backslash character, the
// newline character (which I'm not sure can even be typed into an input
// field) and both types of quote character.
// https://docs.python.org/3/reference/lexical_analysis.html
const InvalidMessageCharactersRegExp = new RegExp("[^ _a-zA-Z0-9-]", "g");

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
  const attemptIfReady = useJrEditActions(
    (a) => a.upsertHatBlockInteraction.attemptIfReady
  );

  const chosen = chosenKind === kind;
  const classes = classNames("EventKindOption", { chosen });

  return (
    <li
      className={classes}
      onClick={() => setChosenKind(kind)}
      onDoubleClick={() => attemptIfReady()}
    >
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
      <span className="key-button" onClick={onEditClick}>
        <span className="key-display-name">{displayName}</span>
        <span className="dropdown-indicator">▾</span>
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

  // This is a bit clunky.  We have to always use the same hooks, so
  // have to handle the case that this modal is not currently active.
  // Use an arbitrary ActorKind ("sprite") if we're not active (in which
  // case the state's upsertion-descriptor will have a nonsense
  // actorId); it will make no real difference.
  const actorKind = useMappedProgram("UpsertHandlerModal", (program) =>
    isActive
      ? StructuredProgramOps.uniqueActorById(
          program,
          upsertionDescriptor.actorId
        ).kind
      : "sprite"
  );

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

  const handleMessageChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const rawValue = evt.target.value;
    const value = rawValue.replace(InvalidMessageCharactersRegExp, "");
    setMessageIfChosen(value);
    refreshInputsReady();
  };

  const handleEditKeyClick = () => {
    setMode("choosing-key");
  };

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

  const actorNounPhrase = ActorKindOps.names(actorKind).whenClickedNounPhrase;

  const messageInputClasses = classNames({
    isEmpty: messageIfChosen === "",
  });

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
            <EventKindOption kind="green-flag">
              <div className="content">when green flag clicked</div>
            </EventKindOption>
            <EventKindOption kind="clicked">
              <div className="content">when {actorNounPhrase} clicked</div>
            </EventKindOption>
            <EventKindOption kind="start-as-clone">
              <div className="content">when I start as a clone</div>
            </EventKindOption>
            <EventKindOption kind="key-pressed">
              <div className="content">
                when{" "}
                <KeyEditor
                  displayName={keyIfChosen.displayName}
                  onEditClick={handleEditKeyClick}
                />{" "}
                key pressed
              </div>
            </EventKindOption>
            <EventKindOption kind="message-received">
              <div className="content">
                when I receive “
                <Form.Control
                  className={messageInputClasses}
                  type="text"
                  placeholder="message string value"
                  value={messageIfChosen}
                  onChange={handleMessageChange}
                  // Only select the double-clicked-on word; don't
                  // choose (as if clicking "OK") that hat-block:
                  onDoubleClick={(event) => event.stopPropagation()}
                ></Form.Control>
                ”
              </div>
            </EventKindOption>
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
