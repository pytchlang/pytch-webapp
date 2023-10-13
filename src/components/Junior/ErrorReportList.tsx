import React from "react";

import { EmptyProps } from "../../utils";
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

// eslint does not realise that the type declarations we have on
// UserCodeErrorLocation and SchedulerStepErrorIntro do define the prop
// types.
/* eslint-disable react/prop-types */

const UserCodeErrorLocation: UserCodeErrorLocationComponent = ({
  lineNo,
  colNo,
  isFirst,
}) => {
  const setFocusedActor = useJrEditActions((a) => a.setFocusedActor);
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
    // correct actor.
    if (maybeController != null) {
      maybeController.gotoLocation(localLineNo, localColNo);
      maybeController.focus();
    } else {
      pendingCursorWarp.set({
        handlerId: contextualLoc.handlerId,
        lineNo: localLineNo,
        colNo: localColNo,
      });
      setFocusedActor(contextualLoc.actorId);
      setActorPropertiesActiveTab("code");
    }
  };

  const lineText = isFirst ? "Line" : "line";
  const colText = localColNo != null ? `(position ${localColNo})` : "";

  return (
    <span className="go-to-line" onClick={gotoLine}>
      {lineText} {localLineNo} {colText} of your script
    </span>
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

export const ErrorReportList: React.FC<EmptyProps> = () => (
  <componentsContext.Provider value={juniorComponents}>
    <ErrorReportList_Generic />
  </componentsContext.Provider>
);
