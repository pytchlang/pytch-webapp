import React from "react";
import { ChooseFiles } from "../ChooseFiles";
import { FileProcessingFailures } from "../FileProcessingFailures";
import { asyncFlowModal } from "./utils";
import { settleFunctions } from "../../model/user-interactions/async-user-flow";
import { useFlowActions, useFlowState } from "../../model";
import { assertNever } from "../../utils";
import { FileProcessingFailure } from "../../model/user-interactions/process-files";

export const UploadZipfilesModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.uploadZipfilesFlow);
  const { setChosenFiles } = useFlowActions((f) => f.uploadZipfilesFlow);

  return asyncFlowModal(fsmState, (activeFsmState) => {
    if (activeFsmState.kind === "awaiting-ack-of-notification") {
      const fileFailures: Array<FileProcessingFailure> =
        activeFsmState.outcomeNub.failures.map((failure) => ({
          filename: failure.filename,
          reason: failure.reason,
        }));
      return (
        <FileProcessingFailures
          titleText="Problem uploading project zipfiles"
          introText="Sorry, there was a problem uploading the projects:"
          failures={fileFailures}
          dismiss={activeFsmState.userAck}
        />
      );
    }

    const { chosenFiles } = activeFsmState.runState;
    const settle = settleFunctions(isSubmittable, activeFsmState);

    switch (activeFsmState.kind) {
      case "interacting":
      case "attempting": {
        return (
          <ChooseFiles
            titleText="Upload project zipfiles"
            introText="Choose zipfiles to upload as new projects."
            actionButtonText="Upload"
            status={activeFsmState.kind}
            chosenFiles={chosenFiles}
            setChosenFiles={setChosenFiles}
            tryProcess={settle.submit}
            dismiss={settle.cancel}
          />
        );
      }
      default:
        return assertNever(activeFsmState);
    }
  });
};
