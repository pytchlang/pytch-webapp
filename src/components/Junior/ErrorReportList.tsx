import React from "react";

import { assertNever, EmptyProps } from "../../utils";
import { useJrEditActions } from "./hooks";
import {
  liveSourceMap,
  aceControllerMap,
  pendingCursorWarp,
} from "../../skulpt-connection/code-editor";
import {
  ErrorReportComponents,
  componentsContext,
  SchedulerStepErrorIntroComponent,
  UserCodeErrorLocationComponent,
  ErrorReportList as ErrorReportList_Generic,
} from "../ErrorReportList";
import { useStoreState } from "../../store";
import { Button } from "react-bootstrap";

const UserCodeErrorLocation: UserCodeErrorLocationComponent = ({
  lineNo,
  colNo,
  isFirst,
}) => {
  const setActiveActor = useJrEditActions((a) => a.setActiveActor);
  const setActorPropertiesActiveTab = useJrEditActions(
    (a) => a.setActorPropertiesActiveTab
  );

  const contextualLoc = liveSourceMap.localFromGlobal(lineNo);
  const localLineNo = contextualLoc.lineWithinHandler;

  // Undo indentation added by flattenProgram():
  const localColNo = colNo != null ? colNo - 8 : null;

  const gotoLine = () => {
    console.log("go to line", lineNo, colNo, contextualLoc);

    const maybeController = aceControllerMap.get(contextualLoc.handlerId);

    // If we're already displaying the Ace editor for this script, warp
    // its cursor.  Otherwise, note a warp request and switch to the
    // correct actor and property-tab --- this also covers the case that
    // the correct actor is active but not the Code tab.
    if (maybeController != null) {
      maybeController.gotoLocation(localLineNo, localColNo);
      maybeController.focus();
      maybeController.scrollIntoView(localLineNo);
    } else {
      pendingCursorWarp.set({
        handlerId: contextualLoc.handlerId,
        lineNo: localLineNo,
        colNo: localColNo,
      });
      setActiveActor(contextualLoc.actorId);
      setActorPropertiesActiveTab("code");
    }
  };

  const lineText = isFirst ? "Line" : "line";
  const colText = localColNo != null ? `(position ${localColNo})` : "";

  return (
    <Button className="go-to-line" onClick={gotoLine}>
      {lineText} {localLineNo} {colText} of your script
    </Button>
  );
};

const SchedulerStepErrorIntro: SchedulerStepErrorIntroComponent = ({
  errorContext,
}) => {
  // TODO: What if it was a clone of a Sprite?  Might need to add to
  // errorContext on the VM side?
  const actor =
    errorContext.target_class_kind === "Stage" ? (
      <>The Stage</>
    ) : (
      <>
        The {errorContext.target_class_kind}{" "}
        <code>{errorContext.target_class_name}</code>
      </>
    );

  return (
    <p>
      {actor} was running a script in response to the event{" "}
      <code>{errorContext.event_label}</code>, and encountered this error:
    </p>
  );
};

const juniorComponents: ErrorReportComponents = {
  userCodeErrorLocation: UserCodeErrorLocation,
  schedulerStepErrorIntro: SchedulerStepErrorIntro,
};

export const ErrorReportList: React.FC<EmptyProps> = () => {
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );
  switch (programKind) {
    case "flat":
      // The default for the context is suitable for the "flat" IDE.
      return <ErrorReportList_Generic />;
    case "per-method":
      return (
        <componentsContext.Provider value={juniorComponents}>
          <ErrorReportList_Generic />
        </componentsContext.Provider>
      );
    default:
      return assertNever(programKind);
  }
};
