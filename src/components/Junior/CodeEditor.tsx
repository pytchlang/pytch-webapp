import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../../store";

import { ActorSummaryOps } from "../../model/junior/structured-program/actor";
import classNames from "classnames";
import { HelpSidebar } from "./HelpSidebar";
import { HelpSidebarOpenControl } from "../HelpSidebar";
import { useJrEditActions, useJrEditState, useMappedProgram } from "./hooks";
import { StructuredProgramOps } from "../../model/junior/structured-program";
import { NoContentHelp } from "./NoContentHelp";
import { PytchScriptEditor } from "./PytchScriptEditor";

import { AddSomethingSingleButton } from "./AddSomethingButton";
import { EmptyProps, PYTCH_CYPRESS } from "../../utils";
import { aceControllerMap } from "../../skulpt-connection/code-editor";

const AddHandlerButton: React.FC<EmptyProps> = () => {
  const focusedActorId = useJrEditState((s) => s.focusedActor);
  const launchUpsertAction = useJrEditActions(
    (a) => a.upsertHatBlockInteraction.launch
  );
  const launchAdd = () => {
    launchUpsertAction({ actorId: focusedActorId, action: { kind: "insert" } });
  };

  return <AddSomethingSingleButton onClick={launchAdd} />;
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

  // Purge map entries for handlers not in this instantiation of editor.
  useEffect(() => {
    aceControllerMap.deleteExcept(handlerIds);
  });

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

  // TODO: Get a list of which handlers have raised errors.  Give them a
  // red (#c66 is OK for a start) background panel.  0.5rem of padding
  // and of margin, then make the padding #c66 when that script's ID is
  // in the list.

  // For computing prevHandlerId and nextHandlerId, indexing into
  // handlerIds either with -1 or with nHandlers gives undefined, which
  // is a bit messy, but works for null.
  return wrap(
    <>
      {handlerIds.map((hid, idx) => (
        <PytchScriptEditor
          key={hid}
          actorKind={kind}
          actorId={actorId}
          handlerId={hid}
          prevHandlerId={handlerIds[idx - 1]}
          nextHandlerId={handlerIds[idx + 1]}
        />
      ))}
    </>
  );
};

export const CodeEditor = () => {
  // Normally we'd let the <Tabs> component worry about whether a
  // particular <Tab> is shown or hidden.  But we want the
  // aceControllerMap to accurately represent whether a particular
  // editor is visible (as opposed to rendered but not displayed), so we
  // manually check whether the CodeEditor should be visible to keep
  // aceControllerMap accurate.  And at that point we may as well bail
  // out and save some work if the Code tab is not active.
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  if (activeTab !== "code") {
    aceControllerMap.clear();
    return null;
  }

  return (
    <div className="Junior-CodeEditor abs-0000">
      <HelpSidebarMachinery />
      <ScriptsEditor />
    </div>
  );
};
