import React from "react";
import { EmptyProps, assertNever } from "../utils";
import { useStoreActions, useStoreState } from "../store";
import { LessonDescriptor } from "../model/linked-content";

type LinkedSpecimenContentProps = { lesson: LessonDescriptor };
const LinkedSpecimenContent: React.FC<LinkedSpecimenContentProps> = ({
  lesson,
}) => {
  return (
    <>
      <p>{lesson.project.name}</p>
      {/* TODO: Dropdown button */}
      <div>⋮</div>
    </>
  );
};

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
      case "succeeded": {
        const linkedContent = linkedContentLoadingState.linkedContent;
        switch (linkedContent.kind) {
          case "none":
            // Shouldn't get here, because of early-exit when
            // linkedContentRef.kind === "none".
            return <div />;
          case "specimen":
            return <LinkedSpecimenContent lesson={linkedContent.lesson} />;
          default:
            return assertNever(linkedContent);
        }
      }
      default:
        return assertNever(linkedContentLoadingState);
    }
  })();

  return <div className="LinkedContentBar">{content}</div>;
};
