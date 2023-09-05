import React from "react";
import { assertNever } from "../../utils";
import { ChooseFiles } from "../ChooseFiles";
import { FileProcessingFailures } from "../FileProcessingFailures";
import { useJrEditActions, useJrEditState } from "./hooks";

// TODO: Restrict chosen files to either "image" or "audio" major
// mime-type.  The "accept" attribute on <Form.Control type="file">
// should do the job.  With some extra logic to reject files of the
// wrong type in case the user overrides the browser's suggestion as to
// which files are allowed.
export const AddJrAssetsModal = () => {
  const state = useJrEditState((s) => s.addAssetsInteraction.state);
  const { tryProcess, dismiss } = useJrEditActions(
    (a) => a.addAssetsInteraction
  );

  switch (state.status) {
    case "idle":
      return null;
    case "awaiting-user-choice":
    case "trying-to-process":
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
      return assertNever(state);
  }
};
