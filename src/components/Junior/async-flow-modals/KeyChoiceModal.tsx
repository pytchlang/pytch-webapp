import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import classNames from "classnames";
import {
  KeyDescriptor,
  keyboardLayout,
} from "../../../model/junior/keyboard-layout";
import { FocusGroupContainer } from "../../FocusGroupContainer";

type KeyOptionProps = {
  descriptor: KeyDescriptor;
  selectedKey: KeyDescriptor;
  onClick(): void;
  onDoubleClick(): void;
};
const KeyOption: React.FC<KeyOptionProps> = ({
  descriptor,
  selectedKey,
  onClick,
  onDoubleClick,
}) => {
  const { browserKeyName, displayName } = descriptor;
  const isSelected = browserKeyName === selectedKey.browserKeyName;

  // Ugly hack to get wide spacebar:
  const classes = classNames("KeyOption", {
    isSelected,
    spacebar: browserKeyName === " ",
  });

  return (
    <Button
      variant="secondary"
      className={classes}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span>{displayName}</span>
    </Button>
  );
};

type KeyChoiceModalProps = {
  startingKey: KeyDescriptor;
  onCancel(): void;
  onAccept(chosenKey: KeyDescriptor): void;
};
export const KeyChoiceModal: React.FC<KeyChoiceModalProps> = ({
  startingKey,
  onCancel,
  onAccept,
}) => {
  const [selectedKey, selectKey] = useState(startingKey);

  // Suppress bootstrap's restore-focus behaviour; we handle that
  // ourselves in the UpsertHandlerModal.
  return (
    <Modal
      className="KeyChoiceModal"
      animation={false}
      centered={true}
      restoreFocus={false}
      show={true}
    >
      <Modal.Header>
        <Modal.Title>Choose a key</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FocusGroupContainer groupedFocusKey="WhenKeyPressedOptionsList">
        <ol className="keyboard">
          {keyboardLayout.map((row) => (
            <li key={"row-" + row[0].browserKeyName} className="key-row">
            <ol className="keyboard-row">
              {row.map((descr) => (
                <KeyOption
                  key={descr.browserKeyName}
                  descriptor={descr}
                  selectedKey={selectedKey}
                  onClick={() => selectKey(descr)}
                  onDoubleClick={() => onAccept(descr)}
                />
              ))}
            </ol>
            </li>
          ))}
        </ol>
        </FocusGroupContainer>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onAccept(selectedKey)}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
