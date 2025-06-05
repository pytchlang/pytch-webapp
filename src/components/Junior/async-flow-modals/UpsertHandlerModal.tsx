import React, {
  ChangeEvent,
  createRef,
  MouseEventHandler,
  useState,
} from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { MaybeErrorOrSuccessReport } from "../../MaybeErrorOrSuccessReport";
import {
  ActorKindOps,
  EventDescriptorKind,
} from "../../../model/junior/structured-program";
import { submitOnEnterKeyFun } from "../../../utils";
import { KeyChoiceModal } from "./KeyChoiceModal";
import { useJrEditActions, useJrEditState } from "../hooks";
import classNames from "classnames";
import {
  isActive,
  isInteractable,
  isSucceeded,
  maybeLastFailureMessage,
  settleFunctions,
} from "../../../model/user-interactions/async-user-flow";
import { asyncFlowModal } from "../../async-flow-modals/utils";
import { useFocusContext } from "../../hooks/focus-steering";
import {
  focusGroupNavigationSuppression,
  kFocusGroupContainerClassName,
  kFocusGroupItemClassName,
} from "../../../model/junior/grouped-focus";

// TODO: Is this unduly restrictive?  I think we should end up with a
// valid Python string literal if we forbid the backslash character, the
// newline character (which I'm not sure can even be typed into an input
// field) and both types of quote character.
// https://docs.python.org/3/reference/lexical_analysis.html
const InvalidMessageCharactersRegExp = new RegExp("[^ _a-zA-Z0-9-]", "g");

type EventKindOptionProps = React.PropsWithChildren<{
  chosenKind: EventDescriptorKind;
  kind: EventDescriptorKind;
  onDoubleClick: () => void;
}>;
const EventKindOption: React.FC<EventKindOptionProps> = ({
  chosenKind,
  kind,
  onDoubleClick,
  children,
}) => {
  const focusContext = useFocusContext("per-method");
  const setChosenKind = useJrEditActions(
    (a) => a.upsertHatBlockFlow.setChosenKind
  );

  const chosen = chosenKind === kind;
  const classes = classNames("EventKindOption", kFocusGroupItemClassName, {
    chosen,
  });

  const onClick: MouseEventHandler<HTMLElement> = (ev) => {
    setChosenKind(kind);
    focusContext.onGroupItemClick(ev);
  };

  return (
    <li
      className={classes}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      data-event-handler-kind={kind}
    >
      <div className="bump" />
      {children}
    </li>
  );
};

type KeyEditorProps = {
  isTabStop: boolean;
  displayName: string;
  onEditClick(): void;
};
const KeyEditor: React.FC<KeyEditorProps> = ({
  isTabStop,
  displayName,
  onEditClick,
}) => {
  return (
    <div
      className="KeyEditor"
      role="button"
      tabIndex={isTabStop ? 0 : -1}
      onFocus={focusGroupNavigationSuppression.onFocus}
      onBlur={focusGroupNavigationSuppression.onBlur}
    >
      <span className="key-button" onClick={onEditClick}>
        <span className="key-display-name">{displayName}</span>
        <span className="dropdown-indicator">▾</span>
      </span>
    </div>
  );
};

export const UpsertHandlerModal = () => {
  const focusContext = useFocusContext("per-method");

  const { fsmState, isSubmittable } = useJrEditState(
    (s) => s.upsertHatBlockFlow
  );
  const [showEmptyMessageError, setShowEmptyMessageError] = useState(false);

  const { setMode, setKeyIfChosen, setMessageIfChosen } = useJrEditActions(
    (a) => a.upsertHatBlockFlow
  );
  const setChosenKind = useJrEditActions(
    (a) => a.upsertHatBlockFlow.setChosenKind
  );

  const ulRef: React.RefObject<HTMLUListElement> = createRef();

  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { mode, chosenKind, keyIfChosen, messageIfChosen, actorKind } =
      activeFsmState.runState;
    const settle = settleFunctions(isSubmittable, activeFsmState);

    const maybeAttemptUpsert = () => {
      if (isSubmittable) {
        settle.submit();
      } else {
        setShowEmptyMessageError(true);
      }
    };

    const handleClose = () => {
      settle.cancel();
      setShowEmptyMessageError(false);
    };

    const handleKeyDown = submitOnEnterKeyFun(maybeAttemptUpsert, true);

    const handleMessageChange = (evt: ChangeEvent<HTMLInputElement>) => {
      const rawValue = evt.target.value;
      const value = rawValue.replace(InvalidMessageCharactersRegExp, "");
      setMessageIfChosen(value);
      setShowEmptyMessageError(false);
    };

    const handleEditKeyClick = () => {
      setMode("choosing-key");
    };

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
      showEmptyMessageError,
    });

    const emptyMessageHintClasses = classNames("empty-message-hint", {
      showEmptyMessageError:
        chosenKind === "message-received" && showEmptyMessageError,
    });

    // Base props for <EventKindOption> instances:
    const ekoProps = { chosenKind, onDoubleClick: settle.submit };

    const mCloneHatBlockOption = actorKind === "sprite" && (
      <EventKindOption {...ekoProps} kind="start-as-clone">
        <div className="content">when I start as a clone</div>
      </EventKindOption>
    );

    const setChosenFromFocused = (elt: HTMLElement) => {
      const kind = elt.dataset.eventHandlerKind as EventDescriptorKind;
      if (kind == null) {
        console.warn("no kind data attr in", elt);
        return;
      }
      setChosenKind(kind);
    };

    // Disable `restoreFocus` behaviour; we use `onDispose()` to manage
    // ourselves where the focus goes after the modal dialog goes away.
    // See code in `CodeEditor` (for add=insert) and `HatBlock` (for
    // change=update).  Also disable "autoFocus" because we use the
    // grouped-focus mechanism to enqueue a focus request.
    return (
      <Modal
        className="UpsertHandlerModal"
        show={isActive(activeFsmState)}
        onHide={handleClose}
        animation={false}
        autoFocus={false}
        restoreFocus={false}
        centered
      >
        <Modal.Header closeButton={isInteractable(activeFsmState)}>
          <Modal.Title>Choose hat block</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div
              ref={focusContext.groupContainerRefCallback({
                onFocusFromKeyboard: setChosenFromFocused,
                onFocusFromPendingRequest: setChosenFromFocused,
              })}
              className={kFocusGroupContainerClassName}
              data-grouped-focus-key={`UpsertHandlerModal/${actorKind}`}
            >
              <ul tabIndex={-1} onKeyDown={handleKeyDown} ref={ulRef}>
                <EventKindOption {...ekoProps} kind="green-flag">
                  <div className="content">when green flag clicked</div>
                </EventKindOption>
                <EventKindOption {...ekoProps} kind="clicked">
                  <div className="content">when {actorNounPhrase} clicked</div>
                </EventKindOption>
                {mCloneHatBlockOption}
                <EventKindOption {...ekoProps} kind="key-pressed">
                  <div className="content">
                    when{" "}
                    <KeyEditor
                      isTabStop={chosenKind === "key-pressed"}
                      displayName={keyIfChosen.displayName}
                      onEditClick={handleEditKeyClick}
                    />{" "}
                    key pressed
                  </div>
                </EventKindOption>
                <EventKindOption
                  chosenKind={chosenKind}
                  kind="message-received"
                  onDoubleClick={maybeAttemptUpsert}
                >
                  <div className="content">
                    when I receive “
                    <Form.Control
                      tabIndex={chosenKind === "message-received" ? 0 : -1}
                      className={messageInputClasses}
                      type="text"
                      placeholder="message"
                      readOnly={chosenKind !== "message-received"}
                      value={messageIfChosen}
                      onChange={handleMessageChange}
                      // Only select the double-clicked-on word; don't
                      // choose (as if clicking "OK") that hat-block:
                      onDoubleClick={(event) => event.stopPropagation()}
                      onFocus={focusGroupNavigationSuppression.onFocus}
                      onBlur={focusGroupNavigationSuppression.onBlur}
                    ></Form.Control>
                    ”
                  </div>
                </EventKindOption>
                <li className={emptyMessageHintClasses}>
                  Please provide a message.
                </li>
              </ul>
            </div>
          </Form>
          <MaybeErrorOrSuccessReport
            messageWhenSuccess={"" /* not used; we skip "succeeded" */}
            attemptSucceeded={isSucceeded(activeFsmState)}
            maybeLastFailureMessage={maybeLastFailureMessage(activeFsmState)}
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
            disabled={!isInteractable}
            variant="primary"
            onClick={maybeAttemptUpsert}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};
