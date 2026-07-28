import React, {
  ChangeEvent,
  KeyboardEventHandler,
  MouseEventHandler,
  useRef,
  useState,
} from "react";
import { Trans, useTranslation } from "react-i18next";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { EventDescriptorKind } from "../../../model/junior/structured-program";
import { submitOnEnterKeyFun } from "../../../utils";
import { KeyChoiceModal } from "./KeyChoiceModal";
import { useJrEditActions, useJrEditState } from "../hooks";
import classNames from "classnames";
import {
  isActive,
  isInteractable,
  settleFunctions,
} from "../../../model/user-interactions/async-user-flow";
import { asyncFlowModal } from "../../async-flow-modals/utils";
import { HandlerUpsertionMode } from "../../../model/junior/upsert-hat-block";
import { useFocusContext } from "../../hooks/focus-steering";
import {
  focusGroupNavigationSuppression,
  kFocusGroupContainerClassName,
  kFocusGroupItemClassName,
} from "../../../model/junior/grouped-focus";
import { FocusGroupContainer } from "../../FocusGroupContainer";
import { keyInLayoutLocator } from "../../../model/junior/keyboard-layout";

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
      {/*<div className="bump" />*/}
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
  const onKeyDown: KeyboardEventHandler = (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      onEditClick();
      ev.preventDefault();
      ev.stopPropagation();
    }
  };

  return (
    <div
      className="KeyEditor"
      role="button"
      tabIndex={isTabStop ? 0 : -1}
      onKeyDown={onKeyDown}
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
  const { t } = useTranslation("ide");
  const { t: tCommon } = useTranslation("common");
  const focusContext = useFocusContext("per-method");
  const prevModeRef = useRef<HandlerUpsertionMode | null>(null);

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

  const ulRef = React.useRef<HTMLUListElement>(null);

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
      if (value !== "") {
        setShowEmptyMessageError(false);
      }
    };

    const handleEditKeyClick = () => {
      setMode("choosing-key");
      const currentChoiceLoc = keyInLayoutLocator(keyIfChosen.browserKeyName);
      focusContext.setBookmark(
        "WhenKeyPressedOptionsList",
        currentChoiceLoc.flatIdx
      );
      focusContext.setPendingGroupFocusKey("WhenKeyPressedOptionsList");
    };

    if (mode === "choosing-key") {
      prevModeRef.current = mode;
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
        <div className="content">
          <Trans i18nKey="hat-block-content.start-as-clone" ns="ide" />
        </div>
      </EventKindOption>
    );

    const keyPressedOptionDivRefCb = (elt: HTMLDivElement | null) => {
      if (prevModeRef.current === "choosing-key" && elt != null) {
        const dropdownDivs = elt.getElementsByClassName("KeyEditor");
        const mDropdownDiv = dropdownDivs[0] as HTMLDivElement | null;
        mDropdownDiv?.focus();
        prevModeRef.current = mode;
      }
    };

    const setChosenFromFocused = (elt: HTMLElement) => {
      const kind = elt.dataset.eventHandlerKind as EventDescriptorKind;
      if (kind == null) {
        console.warn("no kind data attr in", elt);
        return;
      }
      setChosenKind(kind);
    };

    const keyChoiceComponent = (
      <KeyEditor
        isTabStop={chosenKind === "key-pressed"}
        displayName={keyIfChosen.displayName}
        onEditClick={handleEditKeyClick}
      />
    );

    const messageInputComponent = (
      <Form.Control
        tabIndex={chosenKind === "message-received" ? 0 : -1}
        className={messageInputClasses}
        type="text"
        placeholder={t("upsert-handler-modal.message-placeholder")}
        readOnly={chosenKind !== "message-received"}
        value={messageIfChosen}
        onChange={handleMessageChange}
        // Only select the double-clicked-on word; don't choose (as if
        // clicking "OK") that hat-block:
        onDoubleClick={(event) => event.stopPropagation()}
        onFocus={focusGroupNavigationSuppression.onFocus}
        onBlur={focusGroupNavigationSuppression.onBlur}
      />
    );

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
          <Modal.Title>{t("upsert-handler-modal.title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <FocusGroupContainer
              className={kFocusGroupContainerClassName}
              groupedFocusKey={`UpsertHandlerModal/${actorKind}`}
              opts={{
                onFocusFromKeyboard: setChosenFromFocused,
                onFocusFromPendingRequest: setChosenFromFocused,
              }}
            >
              <ul tabIndex={-1} onKeyDown={handleKeyDown} ref={ulRef}>
                <EventKindOption {...ekoProps} kind="green-flag">
                  <div className="content">
                    <Trans i18nKey="hat-block-content.green-flag" ns="ide" />
                  </div>
                </EventKindOption>
                <EventKindOption {...ekoProps} kind="clicked">
                  <div className="content">
                    <Trans
                      i18nKey={`hat-block-content.clicked.${actorKind}`}
                      ns="ide"
                    />
                  </div>
                </EventKindOption>
                {mCloneHatBlockOption}
                <EventKindOption {...ekoProps} kind="key-pressed">
                  <div className="content" ref={keyPressedOptionDivRefCb}>
                    <Trans
                      i18nKey="hat-block-content.key-pressed"
                      ns="ide"
                      components={{ key: keyChoiceComponent }}
                    />
                  </div>
                </EventKindOption>
                <EventKindOption
                  chosenKind={chosenKind}
                  kind="message-received"
                  onDoubleClick={maybeAttemptUpsert}
                >
                  <div className="content">
                    <Trans
                      i18nKey="hat-block-content.message-received"
                      ns="ide"
                      components={{ msg: messageInputComponent }}
                    />
                  </div>
                </EventKindOption>
                <li className={emptyMessageHintClasses}>
                  {t("upsert-handler-modal.empty-message-hint")}
                </li>
              </ul>
            </FocusGroupContainer>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={!isInteractable}
            variant="secondary"
            onClick={handleClose}
          >
            {tCommon("button.cancel")}
          </Button>
          <Button
            disabled={!isInteractable}
            variant="primary"
            onClick={maybeAttemptUpsert}
          >
            {tCommon("button.ok")}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });
};
