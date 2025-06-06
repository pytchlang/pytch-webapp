import React, { createRef, useEffect } from "react";
import { useStoreState, useStoreActions } from "../../store";
import classNames from "classnames";

import { ActorSummaryOps } from "../../model/junior/structured-program/actor";
import {
  useActiveActorKind,
  useHelpHatBlockDrop,
  useJrEditActions,
  useJrEditState,
  useMappedProgram,
} from "./hooks";
import { StructuredProgramOps } from "../../model/junior/structured-program";
import { NoContentHelp } from "./NoContentHelp";
import { PytchScriptEditor } from "./PytchScriptEditor";

import { AddSomethingSingleButton } from "./AddSomethingButton";
import { EmptyProps, PYTCH_CYPRESS } from "../../utils";
import { aceControllerMap } from "../../skulpt-connection/code-editor";
import { useNotableChanges } from "../hooks/notable-changes";
import { ConjoinedResizeObserver } from "../../model/junior/conjoined-resize-observer";
import {
  focusGroupContainerClass,
  kFocusGroupFallbackClassName,
} from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";

const AddHandlerButton: React.FC<EmptyProps> = () => {
  const focusContext = useFocusContext("per-method");
  const focusedActorId = useJrEditState((s) => s.activeActor);
  const focusedActorKind = useActiveActorKind();
  const launchUpsertAction = useJrEditActions((a) => a.upsertHatBlockFlow.run);
  const codingDragInProgress = useJrEditState((s) => s.scriptDragInProgress);

  const launchAdd = () => {
    // Send focus to the bookmarked hat-block when the modal renders.
    const modalFocusGroupKey = `UpsertHandlerModal/${focusedActorKind}`;
    focusContext.setPendingGroupFocusKey(modalFocusGroupKey);

    launchUpsertAction({
      operation: { actorId: focusedActorId, action: { kind: "insert" } },
      actorKind: focusedActorKind,
      onDispose: focusContext.onDisposeAddScript(),
    });
  };

  const classes = classNames({ codingDragInProgress });
  return (
    <AddSomethingSingleButton
      className={classes}
      buttonClassName={kFocusGroupFallbackClassName}
      what="script"
      label="Add script"
      onClick={launchAdd}
    />
  );
};

const ScriptsEditor = () => {
  const focusContext = useFocusContext("per-method");

  // For side-effects only, returning void, so Cypress has access to
  // current state and actions:
  useStoreState((state) => {
    PYTCH_CYPRESS().currentProgram = state.activeProject.project.program;
  });
  useStoreActions((actions) => {
    PYTCH_CYPRESS().currentProgramActions = actions.activeProject;
  });

  const scriptsDivRef = createRef<HTMLDivElement>();

  const actorId = useJrEditState((s) => s.activeActor);

  const { kind, handlerIds } = useMappedProgram(
    "<ScriptsEditor>",
    (program) => StructuredProgramOps.uniqueActorSummaryById(program, actorId),
    ActorSummaryOps.eq
  );

  const scriptAddedEvents = useNotableChanges(
    "script-upserted",
    (change) => change.upsertKind === "insert"
  );
  const scriptWasJustAdded = scriptAddedEvents.length > 0;

  const conjoinedResizeObserver = new ConjoinedResizeObserver(handlerIds);

  useEffect(() => {
    // Purge map entries for handlers not in this instantiation of editor.
    aceControllerMap.deleteExcept(handlerIds);

    // If a new handler has been added, scroll parent DIV to end.
    const scrollDiv = scriptsDivRef.current?.parentElement;
    if (scrollDiv != null && scriptWasJustAdded) {
      scrollDiv.scrollTo({ top: scrollDiv.scrollHeight });
    }

    return () => {
      conjoinedResizeObserver.disconnect();
    };
  }, [handlerIds]);

  const nHandlers = handlerIds.length;

  const maybeNoContentHelp = nHandlers === 0 && (
    <NoContentHelp
      actorKind={kind}
      contentKind="scripts"
      buttonsPlural={false}
    />
  );

  // TODO: Get a list of which handlers have raised errors.  Give them a
  // red (#c66 is OK for a start) background panel.  0.5rem of padding
  // and of margin, then make the padding #c66 when that script's ID is
  // in the list.
  //
  // For computing prevHandlerId and nextHandlerId, indexing into
  // handlerIds either with -1 or with nHandlers gives undefined, which
  // is a bit messy, but works for null.
  const scriptsContent = handlerIds.map((hid, idx) => (
    <li key={hid}>
      <PytchScriptEditor
        actorKind={kind}
        actorId={actorId}
        handlerId={hid}
        prevHandlerId={handlerIds[idx - 1]}
        nextHandlerId={handlerIds[idx + 1]}
        conjoinedResizeObserver={conjoinedResizeObserver}
      />
    </li>
  ));

  // The "pb-5" adds padding below; without this, the above scroll
  // didn't scroll quite to the bottom.  I didn't get to the bottom of
  // this, and adding padding was an easy workaround.  The "pt-2" is to
  // match the margin-top of the appearances and sounds lists, so the
  // NoContentHelp alerts line up for an empty sprite.
  //
  // Is it maybe the same as the issue with scroll-into-view?  I.e.,
  // that the Ace editor is resized after rendering?
  //
  return (
    <div
      ref={focusContext.groupContainerRefCallback()}
      className={focusGroupContainerClass("gfs__actorprops__container")}
      data-grouped-focus-key={`ActorProperties/${actorId}/code`}
    >
      <div ref={scriptsDivRef} className="pt-2 pb-5 Junior-ScriptsEditor">
        {maybeNoContentHelp}
        <ol>{scriptsContent}</ol>
      </div>
      <AddHandlerButton />
    </div>
  );
};

export const CodeEditor = () => {
  const actorId = useJrEditState((s) => s.activeActor);
  const [dropProps, dropRef] = useHelpHatBlockDrop(actorId);

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

  const classes = classNames("Junior-CodeEditor", "abs-0000-oflow", dropProps);

  return (
    <div ref={dropRef} className={classes}>
      <ScriptsEditor />
    </div>
  );
};
