import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import { useStoreState, useStoreActions } from "../store";
import { SyncState } from "../model/project";

type MaybeString = string | null;

const ReadOnlyOverlay = () => {
  const codeSyncState = useStoreState(
    (state) => state.activeProject.codeSyncState
  );
  const maybeMessage = maybeMessageForSync(codeSyncState);

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
    case SyncState.NoProject:
    case SyncState.SyncingFromStorage:
      return "Loading...";
    case SyncState.SyncingToStorage:
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
  const { codeTextOrPlaceholder, codeSyncState } = useStoreState((state) => ({
    codeTextOrPlaceholder: state.activeProject.codeTextOrPlaceholder,
    codeSyncState: state.activeProject.codeSyncState,
  }));
  const setCodeText = useStoreActions(
    (actions) => actions.activeProject.setCodeText
  );

  const readOnly = codeSyncState !== SyncState.Syncd;

  return (
    <div className="CodeEditor">
      <AceEditor
        mode="python"
        theme="github"
        value={codeTextOrPlaceholder}
        name="pytch-ace-editor"
        fontSize={16}
        width="100%"
        height="100%"
        onChange={setCodeText}
        readOnly={readOnly}
      />
      <ReadOnlyOverlay />
    </div>
  );
};

export default CodeEditor;
