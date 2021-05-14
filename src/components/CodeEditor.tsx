import React, { useEffect } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import { useStoreState, useStoreActions } from "../store";
import { setAceController } from "../skulpt-connection/code-editor";
import { IAceEditor } from "react-ace/lib/types";
import { PytchAceAutoCompleter } from "../skulpt-connection/code-completion";
import { failIfNull } from "../utils";

const ReadOnlyOverlay = () => {
  const syncState = useStoreState((state) => state.activeProject.syncState);

  // TODO: Handle "failed" state.
  const maybeMessage =
    syncState.loadState === "pending"
      ? "Loading..."
      : syncState.saveState === "pending"
      ? "Saving..."
      : null;

  if (maybeMessage != null) {
    return (
      <div className="ReadOnlyOverlay">
        <p>{maybeMessage}</p>
      </div>
    );
  }
  return null;
};

const CodeEditor = () => {
  const { codeTextOrPlaceholder, syncState } = useStoreState(
    (state) => state.activeProject
  );

  const aceRef: React.RefObject<AceEditor> = React.createRef();

  // We don't care about the actual value of the stage display size, but
  // we do need to know when it changes, so we can resize the editor in
  // our useEffect() call below.
  useStoreState((state) => state.ideLayout.stageDisplaySize);

  useEffect(() => {
    const ace = failIfNull(aceRef.current, "CodeEditor effect: aceRef is null");
    ace.editor.resize();
  });

  const { setCodeText, noteCodeChange } = useStoreActions(
    (actions) => actions.activeProject
  );

  const readOnly =
    syncState.loadState === "pending" || syncState.saveState === "pending";
  const setGlobalRef = (editor: IAceEditor) => {
    setAceController(editor);
  };

  // (The cast "as any" for the "enableBasicAutocompletion" option is
  // because it is typed as taking either a boolean or an array of
  // strings, whereas it will in fact take an array of class instances,
  // which is how we use it here.)

  const updateCodeText = (text: string) => {
    setCodeText(text);
    noteCodeChange();
  };

  return (
    <div className="CodeEditor">
      <AceEditor
        ref={aceRef}
        mode="python"
        theme="github"
        enableBasicAutocompletion={[new PytchAceAutoCompleter() as any]}
        value={codeTextOrPlaceholder}
        name="pytch-ace-editor"
        fontSize={16}
        width="100%"
        height="100%"
        onLoad={setGlobalRef}
        onChange={updateCodeText}
        readOnly={readOnly}
      />
      <ReadOnlyOverlay />
    </div>
  );
};

export default CodeEditor;
