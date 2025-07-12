import React from "react";
import { asyncFlowModal } from "./utils";
import { useFlowActions, useFlowState } from "../../model";
import { ChooseFiles } from "../ChooseFiles";
import { FileProcessingFailures } from "../FileProcessingFailures";
import { settleFunctions } from "../../model/user-interactions/async-user-flow";
import { assertNever } from "../../utils";

export const AddAssetsModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.addAssetsFlow);
  const setChosenFiles = useFlowActions((f) => f.addAssetsFlow.setChosenFiles);

  return asyncFlowModal(fsmState, (activeState) => {
    const { operationContext, chosenFiles } = activeState.runState;
    const assetPlural = operationContext.assetPlural;

    if (activeState.kind === "awaiting-ack-of-notification") {
      // TODO: Compute proper value when available.
      const error = { fileFailures: [] };
      const titleText = `Problem adding ${assetPlural}`;
      return (
        <FileProcessingFailures
          titleText={titleText}
          introText="Sorry, there was a problem adding files to your project:"
          failures={error.fileFailures}
          dismiss={activeState.userAck}
        />
      );
    }

    const settle = settleFunctions(isSubmittable, activeState);

    switch (activeState.kind) {
      case "interacting":
      case "attempting": {
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
