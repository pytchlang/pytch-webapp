import React from "react";
import { EmptyProps, assertNever } from "../../utils";
import { useJrEditState } from "./hooks";
import { MaybeContent as MaybeLessonContent } from "./lesson/MaybeContent";
import { WidthMonitor } from "./WidthMonitor";
import { HelpSidebar } from "../HelpSidebar";
import Tutorial from "../Tutorial";

export const ActivityContent: React.FC<EmptyProps> = () => {
  const s = useJrEditState((s) => s.activityContentState);

  if (s.kind === "collapsed") {
    return <WidthMonitor nonStageWd={576} />;
  }

  const content = (() => {
    switch (s.tab) {
      case "helpsidebar":
        return (
          <>
            <WidthMonitor nonStageWd={980} />
            <HelpSidebar />
          </>
        );
      case "lesson":
      case "specimen":
        // This is a bit of a fudge.  We treat these both as "lesson"
        // and then within MaybeLessonContent distinguish between
        // tutorials and specimens.
        return <MaybeLessonContent />;
      case "tutorial":
        return <Tutorial />;
      default:
        return assertNever(s.tab);
    }
  })();

  return (
    <div className="ActivityContent-container" tabIndex={-1}>
      <div className="ActivityContent abs-0000">{content}</div>
    </div>
  );
};
