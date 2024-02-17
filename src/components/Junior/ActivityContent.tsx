import React, { useEffect } from "react";
import { EmptyProps, assertNever } from "../../utils";
import { useStoreActions } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";
import { HelpSidebarInnerContent } from "../HelpSidebar";
import { MaybeContent as MaybeLessonContent } from "./lesson/MaybeContent";
import { StructuredProgramOps } from "../../model/junior/structured-program";
import { HelpDisplayContext } from "../../model/help-sidebar";

const HelpSidebar = () => {
  const ensureHaveContent = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar.ensureHaveContent
  );
  const focusedActorId = useJrEditState((s) => s.focusedActor);
  const focusedActorKind = useMappedProgram(
    "<HelpSidebar>",
    (program) =>
      StructuredProgramOps.uniqueActorById(program, focusedActorId).kind
  );

  useEffect(() => {
    ensureHaveContent();
  });

  const displayContext: HelpDisplayContext = {
    programKind: "per-method",
    actorKind: focusedActorKind,
  };

  return (
    <div className="HelpSidebar">
      <div className="content">
        <div className="inner-content">
          <HelpSidebarInnerContent displayContext={displayContext} />
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
