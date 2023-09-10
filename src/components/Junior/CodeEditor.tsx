import React from "react";
import { useStoreState, useStoreActions } from "../../store";

import { ActorSummaryOps } from "../../model/junior/structured-program/actor";
import classNames from "classnames";
import { HelpSidebar } from "./HelpSidebar";
import { HelpSidebarOpenControl } from "../HelpSidebar";
import { useJrEditActions, useJrEditState, useMappedProgram } from "./hooks";
import { StructuredProgramOps } from "../../model/junior/structured-program";
import { NoContentHelp } from "./NoContentHelp";
import { PytchScriptEditor } from "./PytchScriptEditor";

import { AddSomethingButton } from "./AddSomethingButton";
import { EmptyProps, PYTCH_CYPRESS } from "../../utils";

const AddHandlerButton: React.FC<EmptyProps> = () => {
  const focusedActorId = useJrEditState((s) => s.focusedActor);
  const launchUpsertAction = useJrEditActions(
    (a) => a.upsertHatBlockInteraction.launch
  );
  const launchAdd = () => {
    launchUpsertAction({ actorId: focusedActorId, action: { kind: "insert" } });
  };

  return <AddSomethingButton onClick={launchAdd} />;
};

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
  // For side-effects only, returning void, so Cypress has access to
  // current state and actions:
  useStoreState((state) => {
    PYTCH_CYPRESS().currentProgram = state.activeProject.project.program;
  });
  useStoreActions((actions) => {
    PYTCH_CYPRESS().currentProgramActions = actions.activeProject;
  });

  const actorId = useJrEditState((s) => s.focusedActor);

  const { kind, handlerIds } = useMappedProgram(
    "<ScriptsEditor>",
    (program) => StructuredProgramOps.uniqueActorSummaryById(program, actorId),
    ActorSummaryOps.eq
  );

  const nHandlers = handlerIds.length;

  const wrap = (content: JSX.Element) => (
    <div className="Junior-ScriptsEditor">
      {content}
      <AddHandlerButton />
    </div>
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
