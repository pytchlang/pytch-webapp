import React from "react";
import { EmptyProps, assertNever } from "../../../utils";
import { useLinkedContentLoadingStateSummary } from "../../../model/linked-content";

import { Content } from "./Content";
import { ContentLoadingSpinner } from "../ContentLoadingSpinner";
import { SpecimenInformation } from "./SpecimenInformation";
import { ErrorMessageDisplay } from "../../ErrorMessageDisplay";
import { DemoSidebar } from "../../demo-sidebar/DemoSidebar";
import { mkRawSpec } from "../../../model/i18n/core-types";

export const MaybeContent: React.FC<EmptyProps> = () => {
  const linkedContentState = useLinkedContentLoadingStateSummary();
  switch (linkedContentState.kind) {
    case "idle":
      return null;
    case "succeeded": {
      const contentKind = linkedContentState.contentKind;
      switch (contentKind) {
        case "none":
          return null;
        case "jr-tutorial":
          return <Content />;
        case "specimen":
          return <SpecimenInformation />;
        case "demo":
          return <DemoSidebar />;
        default:
          return assertNever(contentKind);
      }
    }
    case "failed":
      return (
        <div className="m-4">
          <h2>Problem loading content</h2>
          <ErrorMessageDisplay
            errorSpec={mkRawSpec(linkedContentState.message)}
          />
        </div>
      );
    case "pending": {
      const contentKind = linkedContentState.contentKind;
      switch (contentKind) {
        case "none":
          return null;
        case "jr-tutorial":
        case "specimen":
        case "demo":
          return (
            <div className="Junior-LessonContent-container">
              <ContentLoadingSpinner />
            </div>
          );
        default:
          return assertNever(contentKind);
      }
    }
    default:
      return assertNever(linkedContentState);
  }
};
