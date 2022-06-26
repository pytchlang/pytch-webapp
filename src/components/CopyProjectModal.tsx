import React from "react";
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
};
