import React from "react";
import { EmptyProps, assertNever } from "../../../utils";
import { useStoreState } from "../../../store";

import { Content } from "./Content";
import { ContentLoadingSpinner } from "./ContentLoadingSpinner";

export const MaybeContent: React.FC<EmptyProps> = () => {
  const linkedContentState = useStoreState(
    (state) => state.activeProject.linkedContentLoadingState
  );

  switch (linkedContentState.kind) {
    case "idle":
      return null;
    case "succeeded": {
      const contentKind = linkedContentState.linkedContent.kind;
      switch (contentKind) {
        case "none":
          return null;
        case "jr-tutorial":
          return <Content />;
        case "specimen":
          // This shouldn't happen (yet).  Only Pytch-Sr projects
          // should have a linked specimen.
          console.log(
            "per-method project should not be linked to specimen (succeeded)"
          );
          return null;
        default:
          return assertNever(contentKind);
      }
    }
    case "failed":
      console.log("have failed to load linked content");
      return null;
    case "pending": {
      const contentKind = linkedContentState.linkedContentRef.kind;
      switch (contentKind) {
        case "none":
          return null;
        case "jr-tutorial":
          return <ContentLoadingSpinner />;
        case "specimen":
          // This shouldn't happen (yet).  Only Pytch-Sr projects
          // should have a linked specimen.
          console.log(
            "per-method project should not be linked to specimen (pending)"
          );
          return null;
        default:
          return assertNever(contentKind);
      }
    }
    default:
      return assertNever(linkedContentState);
  }
};
