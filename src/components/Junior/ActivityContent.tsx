import React, { useEffect } from "react";
import { EmptyProps, assertNever } from "../../utils";
import { useStoreActions } from "../../store";
import { useJrEditState } from "./hooks";
import { HelpSidebarInnerContent } from "../HelpSidebar";
import { MaybeContent as MaybeLessonContent } from "./lesson/MaybeContent";

const HelpSidebar = () => {
  const ensureHaveContent = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar.ensureHaveContent
  );

  useEffect(() => {
    ensureHaveContent();
  });

  return (
    <div className="HelpSidebar">
      <div className="content">
        <div className="inner-content">
          <HelpSidebarInnerContent activeProgramKind="per-method" />
        </div>
      </div>
    </div>
  );
};

export const ActivityContent: React.FC<EmptyProps> = () => {
  const s = useJrEditState((s) => s.activityContentState);
  if (s.kind === "collapsed") {
    return null;
  }

  const content = (() => {
    switch (s.tab) {
      case "helpsidebar":
        return <HelpSidebar />;
      case "lesson":
        return <MaybeLessonContent />;
      default:
        return assertNever(s.tab);
    }
  })();

  return (
    <div className="ActivityContent-container">
      <div className="ActivityContent abs-0000">{content}</div>
    </div>
  );
};
