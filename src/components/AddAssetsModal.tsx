import React from "react";
import { useStoreActions, useStoreState } from "../store";
import { assertNever } from "../utils";
import { ChooseFiles } from "./ChooseFiles";
import { FileProcessingFailures } from "./FileProcessingFailures";

export const AddAssetsModal = () => {
  const state = useStoreState(
    (state) => state.userConfirmations.addAssetsInteraction.state
  );
  const { tryProcess, dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction
  );
  const assetPlural = useStoreState(
    (state) =>
      state.userConfirmations.addAssetsInteraction.operationContext.assetPlural
  );

  switch (state.status) {
    case "idle":
      return null;
    case "awaiting-user-choice":
    case "trying-to-process": {
      const titleText = `Add ${assetPlural}`;
      const introText = `Choose ${assetPlural} to add to your project.`;

      return (
        <ChooseFiles
          titleText={titleText}
          introText={introText}
          actionButtonText="Add to project"
          status={state.status}
          tryProcess={(files) => tryProcess(files)}
          dismiss={() => dismiss()}
        />
      );
    }
    case "showing-failures": {
      const titleText = `Problem adding ${assetPlural}`;
      return (
        <FileProcessingFailures
          titleText={titleText}
          introText="Sorry, there was a problem adding files to your project:"
          failures={state.failures}
          dismiss={() => dismiss()}
        />
      );
    }
    default:
      assertNever(state);
      return null;
  }
};
