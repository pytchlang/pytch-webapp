import React from "react";
import { EmptyProps, assertNever } from "../utils";
import { useStoreActions, useStoreState } from "../store";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { codeTextEnsuringFlat, useFlatCodeText } from "./hooks/code-text";
import { LessonDescriptor } from "../model/linked-content";

// Not sure about this mixture of props and useStoreState() but it lets
// us work directly with the LessonDescriptor.
type LinkedSpecimenContentProps = { lesson: LessonDescriptor };
const LinkedSpecimenContent: React.FC<LinkedSpecimenContentProps> = ({
  lesson,
}) => {
  const currentCodeText = useFlatCodeText("LinkedSpecimenContent");
  const launchAction = useStoreActions(
    (actions) => actions.userConfirmations.viewCodeDiff.launch
  );

  const originalCodeText = codeTextEnsuringFlat(
    "LinkedSpecimenContent",
    lesson.project.program
  );

  const launch = () => {
    launchAction({
      textA: originalCodeText,
      textB: currentCodeText,
    });
  };

  return (
    <>
      <p>{lesson.project.name}</p>
      <DropdownButton align="end" variant="light" title="⋮">
        <Dropdown.Item onClick={launch}>Compare to original</Dropdown.Item>
      </DropdownButton>
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
    return <div className="LinkedContentBar no-linked-content" />;
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
        const linkedContent = linkedContentLoadingState.content;
        switch (linkedContent.kind) {
          case "none":
            // Shouldn't get here, because of early-exit when
            // linkedContentRef.kind === "none".
            return <div className="inner-no-linked-content" />;
          case "jr-tutorial":
            // TODO: Shouldn't get here, because this component only
            // used in Sr IDE.
            return <div className="inner-no-linked-content" />;
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

  return <div className="LinkedContentBar linked-content">{content}</div>;
};
