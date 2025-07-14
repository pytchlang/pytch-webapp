import React from "react";
import { asyncFlowModal } from "./utils";
import { useFlowActions, useFlowState } from "../../model";
import { ChooseFiles } from "../ChooseFiles";
import { FileProcessingFailures } from "../FileProcessingFailures";
import { settleFunctions } from "../../model/user-interactions/async-user-flow";
import { assertNever } from "../../utils";
import { FileProcessingFailure } from "../../model/user-interactions/process-files";

export const AddAssetsModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.addAssetsFlow);
  const setChosenFiles = useFlowActions((f) => f.addAssetsFlow.setChosenFiles);

  return asyncFlowModal(fsmState, (activeState) => {
    const { operationContext, chosenFiles } = activeState.runState;
    const assetPlural = operationContext.assetPlural;

    switch (activeState.kind) {
      case "awaiting-ack-of-notification": {
      const fileFailures: Array<FileProcessingFailure> =
        activeState.outcomeNub.failures.map((failure) => ({
          filename: failure.displayName,
          reason: failure.reason,
        }));
      const titleText = `Problem adding ${assetPlural}`;
      return (
        <FileProcessingFailures
          titleText={titleText}
          introText="Sorry, there was a problem adding files to your project:"
          failures={fileFailures}
          dismiss={activeState.userAck}
        />
      );
    }

      case "interacting":
      case "attempting": {
        const settle = settleFunctions(isSubmittable, activeState);
        return (
          <ChooseFiles
            titleText={`Add ${assetPlural}`}
            introText={`Choose ${assetPlural} to add to your project.`}
            actionButtonText="Add to project"
            status={activeState.kind}
            chosenFiles={chosenFiles}
            setChosenFiles={setChosenFiles}
            tryProcess={settle.submit}
            dismiss={settle.cancel}
          />
        );
      }
      default:
        return assertNever(activeState);
    }
  });
};
