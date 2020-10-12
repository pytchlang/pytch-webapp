import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import { useStoreState, useStoreActions } from "../store";
import { SyncState } from "../model/project";
import { setAceController } from "../skulpt-connection/code-editor";
import { IAceEditor } from "react-ace/lib/types";
import { PytchAceAutoCompleter } from "../skulpt-connection/code-completion";

type MaybeString = string | null;

const ReadOnlyOverlay = () => {
  const syncState = useStoreState((state) => state.activeProject.syncState);
  const maybeMessage = maybeMessageForSync(syncState);

  if (maybeMessage != null) {
    return (
      <div className="ReadOnlyOverlay">
        <p>{maybeMessage}</p>
      </div>
    );
  }
  return null;
};

const maybeMessageForSync = (syncState: SyncState): MaybeString => {
  switch (syncState) {
    case SyncState.SyncNotStarted:
    case SyncState.SyncingFromBackEnd:
      return "Loading...";
    case SyncState.SyncingToBackEnd:
      return "Saving...";
    case SyncState.Syncd:
      return null;
    case SyncState.Error:
      return "ERROR"; // TODO: handle better
  }
};

// TODO: This keeps re-rendering completely when the code text changes.
// Is there a way to be able to force content into the editor, e.g., for
// "loading..." message and initial content when loaded?  Depend on a
// piece of state like "exogenousText", perhaps with also "exogenousSeqNum"
// to force re-display of the same content?  Could keep having onChange
// update the state so other components can get at it.
//
const CodeEditor = () => {
  const { codeTextOrPlaceholder, syncState } = useStoreState((state) => ({
    codeTextOrPlaceholder: state.activeProject.codeTextOrPlaceholder,
    syncState: state.activeProject.syncState,
  }));
  const setCodeText = useStoreActions(
    (actions) => actions.activeProject.setCodeText
  );

  const readOnly = syncState !== SyncState.Syncd;
  const setGlobalRef = (editor: IAceEditor) => {
    setAceController(editor);
  };

  // (The cast "as any" for the "enableBasicAutocompletion" option is
  // because it is typed as taking either a boolean or an array of
  // strings, whereas it will in fact take an array of class instances,
  // which is how we use it here.)

  return (
    <div className="CodeEditor">
      <AceEditor
        mode="python"
        theme="github"
        enableBasicAutocompletion={[new PytchAceAutoCompleter() as any]}
        value={codeTextOrPlaceholder}
        name="pytch-ace-editor"
        fontSize={16}
        width="100%"
        height="100%"
        onLoad={setGlobalRef}
        onChange={setCodeText}
        readOnly={readOnly}
      />
      <ReadOnlyOverlay />
    </div>
  );
};

export default CodeEditor;
