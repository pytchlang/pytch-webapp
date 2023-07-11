import React from "react";
import { useStoreActions, useStoreState } from "../store";
import { assertNever } from "../utils";
import { ChooseFiles } from "./ChooseFiles";
import { FileProcessingFailures } from "./FileProcessingFailures";

export const UploadZipfilesModal = () => {
  const state = useStoreState(
    (state) => state.userConfirmations.uploadZipfilesInteraction.state
  );
  const { tryProcess, dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.uploadZipfilesInteraction
  );

  switch (state.status) {
    case "idle":
      return null;
    case "awaiting-user-choice":
    case "trying-to-process":
      return (
        <ChooseFiles
          titleText="Upload project zipfiles"
          introText="Choose zipfiles to upload as new projects."
          actionButtonText="Upload"
          status={state.status}
          tryProcess={(files) => tryProcess(files)}
          dismiss={() => dismiss()}
        />
      );
    case "showing-failures":
      return (
        <FileProcessingFailures
          titleText="Problem uploading project zipfiles"
          introText="Sorry, there was a problem uploading the projects:"
          failures={state.failures}
          dismiss={() => dismiss()}
        />
      );
    default:
      assertNever(state);
      return null;
  }
};
