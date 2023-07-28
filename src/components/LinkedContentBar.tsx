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

  const content = (() => {
    switch (linkedContentLoadingState.kind) {
      case "failed":
        return (
          <p className="failed">
            Sorry, something went wrong fetching linked content
          </p>
        );
      case "idle":
      case "pending":
        return <p className="loading">Loading linked content...</p>;
      default:
        return assertNever(linkedContentLoadingState);
    }
  })();

  return <div className="LinkedContentBar">{content}</div>;
};
