import React, { useEffect } from "react";
import AceEditor from "react-ace";
import { PytchAceAutoCompleter } from "../../skulpt-connection/code-completion";

import {
  ActorKind,
  StructuredProgramOps,
  Uuid,
} from "../../model/junior/structured-program";
import { useStoreActions } from "../../store";

import {
  AceEditorT,
  aceControllerMap,
  pendingCursorWarp,
} from "../../skulpt-connection/code-editor";

import { HatBlock } from "./HatBlock";
import classNames from "classnames";

import {
  useJrEditActions,
  useMappedProgram,
  usePytchScriptDrag,
  usePytchScriptDrop,
} from "./hooks";

import PytchScriptPreview from "../../images/drag-preview-event-handler.png";
import { DragPreviewImage } from "react-dnd";
import { useNotableChanges } from "../hooks/notable-changes";
import { ConjoinedResizeObserver } from "../../model/junior/conjoined-resize-observer";
import { scrollCursorRowIntoView } from "./PytchScriptEditor-scroller";
import { DevWorkContext } from "../../model/dev-work-context";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import { kFocusGroupItemClassName } from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";

// Adapted from https://stackoverflow.com/a/71952718
const insertElectricFullStop = (editor: AceEditorT) => {
  editor.insert(".");
  editor.execCommand("startAutocomplete");
};

function queryTextarea(aceId: string) {
  return document.querySelector<HTMLTextAreaElement>(`#${aceId} textarea`);
}

type PytchScriptEditorProps = {
  actorKind: ActorKind;
  actorId: Uuid;
  handlerId: Uuid;
  prevHandlerId: Uuid | null;
  nextHandlerId: Uuid | null;
  conjoinedResizeObserver: ConjoinedResizeObserver;
};
export const PytchScriptEditor: React.FC<PytchScriptEditorProps> = ({
  actorKind,
  actorId,
  handlerId,
  prevHandlerId,
  nextHandlerId,
  conjoinedResizeObserver,
}) => {
  const focusContext = useFocusContext("per-method");
  const [dragProps, dragRef, preview] = usePytchScriptDrag(handlerId);
  const [dropProps, dropRef] = usePytchScriptDrop(actorId, handlerId);
  const aceParentRef: React.RefObject<HTMLDivElement> = React.createRef();

  const handler = useMappedProgram("<PytchScriptEditor>", (program) =>
    StructuredProgramOps.uniqueHandlerByIdGlobally(program, handlerId)
  );

  const setHandlerPythonCode = useStoreActions(
    (actions) => actions.activeProject.setHandlerPythonCode
  );
  const setMostRecentFocusedEditor = useJrEditActions(
    (a) => a.setMostRecentFocusedEditor
  );
  const scriptUpsertedChanges = useNotableChanges(
    "script-upserted",
    (change) => change.handlerId === handlerId
  );
  const justUpserted = scriptUpsertedChanges.length > 0;

  const updateCodeText = (code: string) => {
    setHandlerPythonCode({ actorId, handlerId, code });
  };

  useEffect(() => {
    const scroll = () => scrollCursorRowIntoView(handlerId);
    scroll();

    const aceParentDiv = aceParentRef.current;
    if (aceParentDiv == null) return;

    const inputDiv = aceParentDiv.querySelector(".ace_text-input");
    if (inputDiv == null) return;

    inputDiv.addEventListener("keydown", scroll);
    return () => inputDiv.removeEventListener("keydown", scroll);
  }, [aceParentRef]);

  useEffect(() => {
    const aceParentDiv = aceParentRef.current;
    if (aceParentDiv == null) return;

    if (!conjoinedResizeObserver.enabled) {
      // If the "all have resized" event has already fired, we don't
      // need to notify the conjoinedResizeObserver when we resize.
      return;
    }

    let resizeObserver: ResizeObserver | null = null;

    function disconnectObserver() {
      resizeObserver?.disconnect();
      resizeObserver = null;
    }

    resizeObserver = new ResizeObserver((_entries, _observer) => {
      conjoinedResizeObserver.acceptConjunctResizeEvent(handlerId);
      disconnectObserver();
    });

    resizeObserver.observe(aceParentDiv);

    conjoinedResizeObserver.addAllResizedHandler(() => {
      const maybeWarpTarget = pendingCursorWarp.acquireIfForHandler(handlerId);
      if (maybeWarpTarget == null) {
        return;
      }

      const controller = aceControllerMap.get(handlerId);
      if (controller == null) {
        console.log("could not find controller for", handlerId);
        return;
      }

      controller.scrollIntoView(maybeWarpTarget.lineNo);
      controller.gotoLocation(maybeWarpTarget.lineNo, maybeWarpTarget.colNo);
      controller.focus();
    });

    return disconnectObserver;
  }, [aceParentRef, conjoinedResizeObserver]);

  /** Once the editor has loaded, there are a few things we have to do:
   *
   * * Make an entry in the EventHandlerId->Editor map.
   * * Check whether there is a pending cursor-warp request (from the
   *   user clicking on an error-location button).
   * * Turn off "overwrite" mode.
   * * Mark the parent DIV such that e2e tests know everything is ready;
   *   there was some test flakiness which this seemed to help, but the
   *   flakiness was hard to reproduce so not certain.
   *
   * **TODO: Can some of this be unified with the set-up of the Ace
   * editor in "flat" mode?**
   */
  const onAceEditorLoad = (editor: AceEditorT) => {
    aceControllerMap.set(handlerId, editor);

    editor.session.setOverwrite(false);
    editor.commands.removeCommand("overwrite", true);

    editor.commands.addCommand({
      name: "insertElectricFullStop",
      bindKey: { mac: ".", win: "." },
      exec: insertElectricFullStop,
    });

    // Not sure how reliably this is true, but the onLoad seems to fire
    // before aceParentRef is set.  In dev mode, this is OK because
    // React renders everything twice, but when testing against a
    // production build, we don't ever set the attribute.  Poll until we
    // can.  (Messy but seems to be working.)
    function setLoadFiredAttr() {
      const mDiv = aceParentRef.current;
      if (mDiv != null) {
        mDiv.setAttribute("data-on-load-fired", "yes");
        const mTextArea =
          mDiv.querySelector<HTMLTextAreaElement>(":scope textarea");
        if (mTextArea != null) {
          mTextArea.setAttribute("tabIndex", "-1");
          if (mTextArea.dataset.escapeHandlerSet == null) {
            mTextArea.addEventListener("keydown", (evt) => {
              if (evt.key === "Escape") {
                focusContext.focusBookmarkedItem("gfs__actorprops");
              }
            });
            mTextArea.dataset.escapeHandlerSet = "yes";
          }
        }
      } else {
        setTimeout(setLoadFiredAttr, 20);
      }
    }
    setLoadFiredAttr();
  };

  const onAceEditorFocus = () => {
    setMostRecentFocusedEditor(handlerId);
  };

  const nCodeLines = handler.pythonCode.split("\n").length;

  const workContext: DevWorkContext = { programKind: "per-method", actorKind };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completers = [new PytchAceAutoCompleter(workContext) as any];

  const classes = classNames(
    "PytchScriptEditor",
    dragProps,
    dropProps,
    justUpserted && "recent-change-script-upserted"
  );

  // Under live-reload development, the preview image only works the
  // first time you drag a particular script.  It works correctly in a
  // static preview or release build.

  const aceParentDivId = `aceParent-${handler.id}`;

  const aceId = `ace-${handlerId}`;
  const focusTextArea = () => queryTextarea(aceId)?.focus();

  const ccmenuClasses = classNames(
    kFocusGroupItemClassName,
    "PytchScriptEditor-container"
  );

  return (
    <CaptiveContextMenu.Container
      className={ccmenuClasses}
      onClick={focusContext.onGroupItemClick}
      onActivate={focusTextArea}
    >
      <div className={classes}>
        <DragPreviewImage connect={preview} src={PytchScriptPreview} />
        <div ref={dropRef}>
          <div ref={dragRef}>
            <HatBlock
              actorId={actorId}
              actorKind={actorKind}
              handlerId={handlerId}
              prevHandlerId={prevHandlerId}
              nextHandlerId={nextHandlerId}
              event={handler.event}
            />
          </div>
        </div>
        <div className="drag-masked-editor">
          <div ref={aceParentRef} id={aceParentDivId}>
            <div className="hat-code-spacer" />
            <AceEditor
              mode="python"
              theme="pytch"
              enableBasicAutocompletion={completers}
              value={handler.pythonCode}
              onChange={updateCodeText}
              name={aceId}
              onLoad={onAceEditorLoad}
              onFocus={onAceEditorFocus}
              fontSize={14}
              width="100%"
              height="100%"
              minLines={nCodeLines}
              maxLines={nCodeLines}
            />
          </div>
          <div className="drag-mask" />
        </div>
      </div>
    </CaptiveContextMenu.Container>
  );
};
