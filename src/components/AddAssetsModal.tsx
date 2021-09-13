import React from "react";
import { useStoreActions, useStoreState } from "../store";
import { assertNever } from "../utils";
import { ChooseFiles } from "./ChooseFiles";
import { FileProcessingFailures } from "./FileProcessingFailures";

export const AddAssetsModal = () => {
  const state = useStoreState(
    (state) => state.userConfirmations.addAssetsInteraction
  );
  const { tryProcess, dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction
  );

  switch (state.status) {
    case "idle":
      return null;
    case "awaiting-user-choice":
    case "trying-to-add":
      return (
        <ChooseFiles
          titleText="Add images or sounds"
          introText="Choose image or sound files to add to your project."
          actionButtonText="Add to project"
          status={state.status}
          tryProcess={(files) => tryProcess(files)}
          dismiss={() => dismiss()}
        />
      );
    case "showing-failures":
      return (
        <FileProcessingFailures
          titleText="Problem adding images or sounds"
          introText="Sorry, there was a problem adding files to your project:"
          failures={state.failures}
          dismiss={() => dismiss()}
        />
      );
    default:
      assertNever(state);
      return null;
  }
};
