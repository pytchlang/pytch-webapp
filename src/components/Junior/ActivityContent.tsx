import React from "react";
import {assertNever, EmptyProps} from "../../utils";
import {useJrEditState} from "./hooks";
import {MaybeContent as MaybeLessonContent} from "./lesson/MaybeContent";
import {WidthMonitor} from "./WidthMonitor";
import {Tutorial} from "../Tutorial";

import "./ActivityContent.scss";
import {IDESettings} from "./IDESettings";
import {StageWithControls} from "../StageWithControls";
import {InfoActivity} from "./activities/InfoActivity";
import {WorkActivity} from "./activities/WorkActivity";
import {ResultsActivity} from "./activities/ResultsActivity";

export const ActivityContent: React.FC<EmptyProps> = () => {
  const s = useJrEditState((s) => s.activityContentState);

  if (s.kind === "collapsed") {
    return <WidthMonitor nonStageWd={576} />;
  }

  const content = (() => {
    switch (s.tab) {
      case "lesson":
      case "specimen":
        // This is a bit of a fudge.  We treat these both as "lesson"
        // and then within MaybeLessonContent distinguish between
        // tutorials and specimens.
        return <MaybeLessonContent />;
      case "tutorial":
        return <Tutorial />;
      case "demo":
        return (
            <>
                <WidthMonitor nonStageWd={980} />
                <div className={"bg-white h-100"}>
                    <MaybeLessonContent />
                </div>
            </>
        );
      case "info":
        return <InfoActivity />;
      case "settings":
        return <IDESettings />;
      case "work":
        return <WorkActivity />;
      case "results":
        return <ResultsActivity />;
      default:
        return assertNever(s.tab);
    }
  })();

  return (
    <div
      className="ActivityContent-container"
      id={`pytch:activity-bar-tab:tabpanel:${s.tab}`}
      role="tabpanel"
      aria-labelledby={`pytch:activity-bar-tab:tab:${s.tab}`}
    >
      <div className="ActivityContent abs-0000">{content}</div>
    </div>
  );
};
