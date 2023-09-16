import React, { ChangeEvent, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
import { focusOrBlurFun, submitOnEnterKeyFun } from "../utils";
import { CompoundTextInput } from "./CompoundTextInput";
import { FormatSpecifier } from "../model/compound-text-input";

export const RenameAssetModal = () => {
  const {
    fixedPrefix,
    oldStem,
    newStem,
    fixedSuffix,
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    inputsReady,
  } = useStoreState((state) => state.userConfirmations.renameAssetInteraction);

  const { attempt, dismiss, setNewStem, setInputsReady } = useStoreActions(
    (actions) => actions.userConfirmations.renameAssetInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const oldBasename = `${oldStem}${fixedSuffix}`;

  const handleClose = () => dismiss();
  const handleRename = () => {
    // TODO: Put this logic all in one place.
    const newNameSuffix = `${newStem}${fixedSuffix}`;
    attempt({ fixedPrefix, oldNameSuffix: oldBasename, newNameSuffix });
  };

  const handleEnterKey = () => {
    if (inputsReady) {
      handleRename();
    }
  };

  const handleNewUiFragment = (value: string) => {
    // TODO: Move this logic inside setNewStem() action.
    setInputsReady(value !== "" && value !== oldStem);
    setNewStem(value);
  };

  // onChange= set "user has modified suggestion" bit?

  const formatSpecifier: FormatSpecifier = [
    {
      kind: "user-input",
      placeholder: "new filename",
      initialValue: oldStem,
    },
    { kind: "literal", value: fixedSuffix },
  ];

  return (
    <Modal show={isActive} onHide={handleClose} animation={false} centered>
      <Modal.Header closeButton={isInteractable}>
        <Modal.Title>Rename “{oldBasename}”</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CompoundTextInput
          formatSpecifier={formatSpecifier}
          onNewUiFragmentValue={handleNewUiFragment}
          onEnterKey={handleEnterKey}
          ref={inputRef}
        />
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Renamed!"
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
          onClick={handleRename}
        >
          Rename
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
