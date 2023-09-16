import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
import { focusOrBlurFun } from "../utils";
import { CompoundTextInput } from "./CompoundTextInput";
import { FormatSpecifier } from "../model/compound-text-input";

export const RenameAssetModal = () => {
  const {
    oldStem,
    fixedSuffix,
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    inputsReady,
    attemptArgs,
  } = useStoreState((state) => state.userConfirmations.renameAssetInteraction);

  const { attempt, dismiss, setNewStem } = useStoreActions(
    (actions) => actions.userConfirmations.renameAssetInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const oldBasename = `${oldStem}${fixedSuffix}`;

  const handleClose = () => dismiss();
  const handleRename = () => attempt(attemptArgs);

  const handleEnterKey = () => {
    if (inputsReady) {
      handleRename();
    }
  };

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
          onNewUiFragmentValue={setNewStem}
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
