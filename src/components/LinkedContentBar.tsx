import React from "react";
import { EmptyProps, assertNever } from "../utils";
import { useStoreActions, useStoreState } from "../store";

export const LinkedContentBar: React.FC<EmptyProps> = () => {
  const linkedContentRef = useStoreState(
    (state) => state.activeProject.project.linkedContentRef
  );
  const linkedContentLoadingState = useStoreState(
    (state) => state.activeProject.linkedContentLoadingState
  );

  // Don't want to have a flash of "Loading linked content..." if there
  // is no linked content to load.  Return an empty DIV to keep the
  // structure of that part of the DOM consistent.
  if (linkedContentRef.kind === "none") {
    return <div />;
  }
};
