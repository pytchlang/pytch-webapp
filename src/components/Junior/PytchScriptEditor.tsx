import React, { useEffect } from "react";
import {
  ActorKind,
  StructuredProgramOps,
  Uuid,
} from "../../model/junior/structured-program";
import {
  aceControllerMap,
  pendingCursorWarp,
} from "../../skulpt-connection/code-editor";

import { HatBlock } from "./HatBlock";
import classNames from "classnames";

import {
  useMappedProgram,
  usePytchScriptDrag,
  usePytchScriptDrop,
} from "./hooks";

import PytchScriptPreview from "../../images/drag-preview-event-handler.png";
import { DragPreviewImage } from "react-dnd";
import { useScriptJustUpserted } from "../hooks/notable-changes";
import { ConjoinedResizeObserver } from "../../model/junior/conjoined-resize-observer";
import { scrollCursorRowIntoView } from "./PytchScriptEditor-scroller";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import { kFocusGroupItemClassName } from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";
import { PytchScriptAceEditor } from "./PytchScriptAceEditor";

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

  const handlerEvent = useMappedProgram(
    "<PytchScriptEditor>",
    (program) =>
      StructuredProgramOps.uniqueHandlerByIdGlobally(program, handlerId).event
  );

  const justUpserted = useScriptJustUpserted(handlerId);

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

  const classes = classNames(
    "PytchScriptEditor",
    dragProps,
    dropProps,
    justUpserted && "recent-change-script-upserted"
  );

  // Under live-reload development, the preview image only works the
  // first time you drag a particular script.  It works correctly in a
  // static preview or release build.

  const aceParentDivId = `aceParent-${handlerId}`;

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
      <div className={classes} data-handler-id={handlerId}>
        <DragPreviewImage connect={preview} src={PytchScriptPreview} />
        <div ref={dropRef}>
          <div ref={dragRef}>
            <HatBlock
              actorId={actorId}
              actorKind={actorKind}
              handlerId={handlerId}
              prevHandlerId={prevHandlerId}
              nextHandlerId={nextHandlerId}
              event={handlerEvent}
            />
          </div>
        </div>
        <div className="drag-masked-editor">
          <div ref={aceParentRef} id={aceParentDivId}>
            <div className="hat-code-spacer" />
            <PytchScriptAceEditor
              actorKind={actorKind}
              actorId={actorId}
              handlerId={handlerId}
            />
          </div>
          <div className="drag-mask" />
        </div>
      </div>
    </CaptiveContextMenu.Container>
  );
};
