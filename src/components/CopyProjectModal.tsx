import React, { ChangeEvent } from "react";
import { useStoreActions, useStoreState } from "../store";

export const CopyProjectModal = () => {
  const {
    isActive,
    inputsReady,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    sourceProjectId,
    nameOfCopy,
  } = useStoreState((state) => state.userConfirmations.copyProjectInteraction);

  const {
    dismiss,
    attempt,
    setNameOfCopy,
    refreshInputsReady,
  } = useStoreActions(
    (actions) => actions.userConfirmations.copyProjectInteraction
  );

  const handleClose = () => dismiss();
  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setNameOfCopy(evt.target.value);
    refreshInputsReady();
  };
  const handleSaveAs = () => {
    attempt({ sourceProjectId, nameOfCopy });
  };
};
