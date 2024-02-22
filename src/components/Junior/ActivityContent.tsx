import React, { KeyboardEventHandler, useEffect } from "react";
import { EmptyProps, assertNever } from "../../utils";
import { useStoreActions } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";
import { HelpSidebarInnerContent } from "../HelpSidebar";
import { MaybeContent as MaybeLessonContent } from "./lesson/MaybeContent";
import { StructuredProgramOps } from "../../model/junior/structured-program";
import { HelpDisplayContext } from "../../model/help-sidebar";
import { aceControllerMap } from "../../skulpt-connection/code-editor";
import { WidthMonitor } from "./WidthMonitor";

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
  const handlerId = useJrEditState((s) => s.mostRecentFocusedEditor);

  if (s.kind === "collapsed") {
    return <WidthMonitor nonStageWd={576} />;
  }

  const onKey: KeyboardEventHandler = (event) => {
    const mController = aceControllerMap.get(handlerId);
    if (mController != null) {
      // This seems to be enough: looks like the editor reacts to the
      // "keyup" event, which it duly receives.  Shift and control seem
      // OK too.
      mController.editor.focus();
    } else {
      (event.target as HTMLDivElement).blur();
    }
  };

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
        return <MaybeLessonContent />;
      default:
        return assertNever(s.tab);
    }
  })();

  return (
    <div className="ActivityContent-container" tabIndex={-1} onKeyDown={onKey}>
      <div className="ActivityContent abs-0000">{content}</div>
    </div>
  );
};
