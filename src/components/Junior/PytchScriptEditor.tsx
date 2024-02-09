import React from "react";
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
  useMappedProgram,
  usePytchScriptDrag,
  usePytchScriptDrop,
} from "./hooks";

import PytchScriptPreview from "../../images/drag-preview-event-handler.png";
import { DragPreviewImage } from "react-dnd";

// Adapted from https://stackoverflow.com/a/71952718
const insertElectricFullStop = (editor: AceEditorT) => {
  editor.insert(".");
  editor.execCommand("startAutocomplete");
};

type PytchScriptEditorProps = {
  actorKind: ActorKind;
  actorId: Uuid;
  handlerId: Uuid;
  prevHandlerId: Uuid | null;
  nextHandlerId: Uuid | null;
};
export const PytchScriptEditor: React.FC<PytchScriptEditorProps> = ({
  actorKind,
  actorId,
  handlerId,
  prevHandlerId,
  nextHandlerId,
}) => {
  const [dragProps, dragRef, preview] = usePytchScriptDrag(handlerId);
  const [dropProps, dropRef] = usePytchScriptDrop(actorId, handlerId);
  const aceParentRef: React.RefObject<HTMLDivElement> = React.createRef();

  const handler = useMappedProgram("<PytchScriptEditor>", (program) =>
    StructuredProgramOps.uniqueHandlerByIdGlobally(program, handlerId)
  );

  const setHandlerPythonCode = useStoreActions(
    (actions) => actions.activeProject.setHandlerPythonCode
  );

  const updateCodeText = (code: string) => {
    setHandlerPythonCode({ actorId, handlerId, code });
  };

  /** Once the editor has loaded, there are a few things we have to do:
   *
   * * Make an entry in the EventHandlerId->Editor map.
   * * Check whether there is a pending cursor-warp request (from the
   *   user clicking on an error-location button).
   * * Turn off "overwrite" mode.
   * * Mark the parent DIV such that e2e tests know everything is ready;
   *   there was some test flakiness which this seemed to help, but the
   *   flakiness was hard to reproduce so not certain.
   */
  const onAceEditorLoad = (editor: AceEditorT) => {
    const controller = aceControllerMap.set(handlerId, editor);

    const maybeWarpTarget = pendingCursorWarp.acquireIfForHandler(handlerId);
    if (maybeWarpTarget != null) {
      controller.gotoLocation(maybeWarpTarget.lineNo, maybeWarpTarget.colNo);
      controller.focus();
    }

    editor.session.setOverwrite(false);
    editor.commands.removeCommand("overwrite", true);

    editor.commands.addCommand({
      name: "insertElectricFullStop",
      bindKey: { mac: ".", win: "." },
      exec: insertElectricFullStop,
    });

    aceParentRef.current?.setAttribute("data-on-load-fired", "yes");
  };

  const nCodeLines = handler.pythonCode.split("\n").length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completers = [new PytchAceAutoCompleter() as any];

  const classes = classNames("PytchScriptEditor", dragProps, dropProps);

  // Under live-reload development, the preview image only works the
  // first time you drag a particular script.  It works correctly in a
  // static preview or release build.

  return (
    <>
      <DragPreviewImage connect={preview} src={PytchScriptPreview} />
      <div className={classes}>
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
          <div ref={aceParentRef}>
            <div className="hat-code-spacer" />
            <AceEditor
              mode="python"
              theme="github"
              enableBasicAutocompletion={completers}
              value={handler.pythonCode}
              onChange={updateCodeText}
              name={`ace-${handler.id}`}
              onLoad={onAceEditorLoad}
              fontSize={15}
              width="100%"
              height="100%"
              minLines={nCodeLines}
              maxLines={nCodeLines}
            />
          </div>
          <div className="drag-mask" />
        </div>
      </div>
    </>
  );
};
