import React from "react";
import { EmptyProps, assertNever } from "../../utils";
import { useJrEditState, useActivityTabIsActive } from "./hooks";
import { MaybeContent as MaybeLessonContent } from "./lesson/MaybeContent";
import { WidthMonitor } from "./WidthMonitor";
import { HelpSidebar } from "../HelpSidebar";
import { Tutorial } from "../Tutorial";
import { KeyNavHelpSidebar } from "./KeyNavHelpSidebar";
import { LanguageChooser } from "./LanguageChooser";

import "./ActivityContent.scss";

const ActiveActivityContent: React.FC<React.Attributes> = () => {
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
      case "keynavhelp":
        return <KeyNavHelpSidebar />;
      case "i18n":
        return <LanguageChooser />;
      case "lesson":
      case "specimen":
      case "demo":
        // This is a bit of a fudge.  We treat these all as "lesson"
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
    <div
      className="ActivityContent-container"
      id={`pytch:activity-bar-tab:tabpanel:${s.tab}`}
      role="tabpanel"
      aria-labelledby={`pytch:activity-bar-tab:tooltip:${s.tab}`}
    >
      <div className="ActivityContent abs-0000">{content}</div>
    </div>
  );
};

export const ActivityContent: React.FC<EmptyProps> = () => {
  const visibleTabs = useJrEditState((s) => s.visibleActivityTabs);
  const tabIsActive = useActivityTabIsActive();

  return visibleTabs.map((tab) =>
    tabIsActive(tab) ? (
      <ActiveActivityContent key={tab} />
    ) : (
      <div
        key={tab}
        className="visually-hidden"
        id={`pytch:activity-bar-tab:tabpanel:${tab}`}
        role="tabpanel"
        aria-labelledby={`pytch:activity-bar-tab:tooltip:${tab}`}
      />
    )
  );
};
