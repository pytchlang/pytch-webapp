import React from "react";
import { EmptyProps, assertNever } from "../../utils";
import { useJrEditState } from "./hooks";
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

  /* TODO There are, on the surface, two places the DemoSidebar is rendered.
  The one which is followed is under case "demo" here.  There is another
  one, though, in MaybeLessonContent (nb that is the name given on
  import), but that is dead code because we never get to
  MaybeLessonContent unless we're in tab "lesson" or "specimen".  It
  would be easier to go through MaybeContent, because that takes care of
  the loading machinery. - Done*/

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
