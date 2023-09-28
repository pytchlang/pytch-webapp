import React from "react";

import { useJrEditActions } from "./hooks";
import {
  liveSourceMap,
} from "../../skulpt-connection/code-editor";
import {
  UserCodeErrorLocationComponent,
} from "../ErrorReportList";

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

    setFocusedActor(contextualLoc.actorId);
    setActorPropertiesActiveTab("code");
    // TODO: Finish
  };

  const lineText = isFirst ? "Line" : "line";
  const colText = localColNo != null ? `(position ${localColNo})` : "";

  return (
    <span className="go-to-line" onClick={gotoLine}>
      {lineText} {localLineNo} {colText} of your script
    </span>
  );
};
