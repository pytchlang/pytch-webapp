import React from "react";
import { useStoreState, useStoreActions } from "../../store";

import { ActorSummaryOps } from "../../model/junior/structured-program/actor";
import classNames from "classnames";
import { HelpSidebar } from "./HelpSidebar";
import { HelpSidebarOpenControl } from "../HelpSidebar";
import { useJrEditState, useMappedProgram } from "./hooks";
import { StructuredProgramOps } from "../../model/junior/structured-program";
import { NoContentHelp } from "./NoContentHelp";
import { PytchScriptEditor } from "./PytchScriptEditor";

const HelpSidebarMachinery = () => {
  // TODO: The below makes this state be shared between editors for
  // different program-kinds; maybe that's correct?
  const isVisible = useStoreState(
    (state) => state.ideLayout.helpSidebar.isVisible
  );
  const stateClass = isVisible ? "expanded" : "collapsed";

  const classes = classNames("Junior-HelpSidebarMachinery", stateClass);
  return (
    <div className={classes}>
      {isVisible ? <HelpSidebar /> : <HelpSidebarOpenControl />}
    </div>
  );
};

const ScriptsEditor = () => {
  const actorId = useJrEditState((s) => s.focusedActor);

  const { kind, handlerIds } = useMappedProgram(
    "<ScriptsEditor>",
    (program) => StructuredProgramOps.uniqueActorSummaryById(program, actorId),
    ActorSummaryOps.eq
  );

  const nHandlers = handlerIds.length;

  const wrap = (content: JSX.Element) => (
    <div className="Junior-ScriptsEditor">{content}</div>
  );

  if (nHandlers === 0) {
    return wrap(<NoContentHelp actorKind={kind} contentKind="scripts" />);
  }

  return wrap(
    <>
      {handlerIds.map((hid) => (
        <PytchScriptEditor
          key={hid}
          actorKind={kind}
          actorId={actorId}
          handlerId={hid}
        />
      ))}
    </>
  );
};

export const CodeEditor = () => {
  return (
    <div className="Junior-CodeEditor abs-0000">
      <HelpSidebarMachinery />
      <ScriptsEditor />
    </div>
  );
};
