import React from "react";
import classNames from "classnames";
import { useStoreState } from "../store";
import { useJrEditActions, useJrEditState } from "./Junior/hooks";
import { EmptyProps, assertNever } from "../utils";
import { CodeEditor } from "./CodeEditor";
import { InfoPanel } from "./Junior/InfoPanel";
import { ActorProperties } from "./Junior/ActorProperties";

export const EditorForProgramKind: React.FC<EmptyProps> = () => {
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );

  switch (programKind) {
    case "flat":
      return <CodeEditor />;
    case "per-method":
      return <ActorProperties />;
    default:
      return assertNever(programKind);
  }
};

export const EditorAndOutErr: React.FC<EmptyProps> = () => {
  const infoPanelIsCollapsed = useJrEditState(
    (s) => s.infoPanelState === "collapsed"
  );

  const classes = classNames("EditorAndOutErr", { infoPanelIsCollapsed });
  return (
    <div className={classes}>
      <EditorForProgramKind />
      <InfoPanel />
    </div>
  );
};
