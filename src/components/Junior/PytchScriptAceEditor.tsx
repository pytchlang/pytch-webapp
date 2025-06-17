import React from "react";
import AceEditor from "react-ace";
import { PytchAceAutoCompleter } from "../../skulpt-connection/code-completion";
import { useJrEditActions, useMappedProgram } from "./hooks";
import {
  ActorKind,
  StructuredProgramOps,
  Uuid,
} from "../../model/junior/structured-program";
import { useStoreActions } from "../../store";
import {
  aceControllerMap,
  AceEditorT,
} from "../../skulpt-connection/code-editor";
import { useFocusContext } from "../hooks/focus-steering";

// Adapted from https://stackoverflow.com/a/71952718
const insertElectricFullStop = (editor: AceEditorT) => {
  editor.insert(".");
  editor.execCommand("startAutocomplete");
};

type PytchScriptAceEditorProps = {
  actorKind: ActorKind;
  actorId: Uuid;
  handlerId: Uuid;
};
export const PytchScriptAceEditor: React.FC<PytchScriptAceEditorProps> = ({
  actorKind,
  actorId,
  handlerId,
}) => {
  const focusContext = useFocusContext("per-method");
  const setMostRecentFocusedEditor = useJrEditActions(
    (a) => a.setMostRecentFocusedEditor
  );
  const pythonCode = useMappedProgram(
    "<PytchScriptAceEditor>",
    (program) =>
      StructuredProgramOps.uniqueHandlerByIdGlobally(program, handlerId)
        .pythonCode
  );
  const onAceEditorFocus = () => {
    setMostRecentFocusedEditor(handlerId);
  };
  const setHandlerPythonCode = useStoreActions(
    (actions) => actions.activeProject.setHandlerPythonCode
  );

  const updateCodeText = (code: string) => {
    setHandlerPythonCode({ actorId, handlerId, code });
  };

  const aceId = `ace-${handlerId}`;
  const aceParentDivId = `aceParent-${handlerId}`;

  const nCodeLines = pythonCode.split("\n").length;

  const completers = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new PytchAceAutoCompleter({ programKind: "per-method", actorKind }) as any,
  ];

  /** Once the editor has loaded, there are a few things we have to do:
   *
   * * Make an entry in the EventHandlerId->Editor map.
   * * Check whether there is a pending cursor-warp request (from the
   *   user clicking on an error-location button).
   * * Turn off "overwrite" mode.
   * * Make the textarea not be a key-nav tab stop; giving it focus is
   *   handled by the user "activating" the containing script.
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
    editor.commands.addCommand({
      name: "yieldFocusToContainingScript",
      bindKey: { mac: "Escape", win: "Escape" },
      exec: () => focusContext.focusBookmarkedItem("gfs__actorprops"),
    });

    let nSetTabIndexAttempts = 5;
    function setTabIndex() {
      const mDiv = document.getElementById(aceParentDivId);
      if (mDiv != null) {
        const mTextArea = mDiv.querySelector<HTMLElement>(":scope textarea");
        if (mTextArea != null) {
          mTextArea.setAttribute("tabIndex", "-1");
          return;
        }
      }

      // If either we couldn't find the div, or we could find the div
      // but not the textarea, try again a few times at intervals.
      if (nSetTabIndexAttempts > 0) {
        nSetTabIndexAttempts -= 1;
        setTimeout(setTabIndex, 20);
      }
    }
    setTabIndex();
  };

  return (
    <AceEditor
      mode="python"
      theme="pytch"
      enableBasicAutocompletion={completers}
      value={pythonCode}
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
  );
};
