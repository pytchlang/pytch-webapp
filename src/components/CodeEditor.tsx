import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import { useStoreState, useStoreActions } from '../store';
import { SyncState } from "../model/project";


type MaybeString = string | null;

const ReadOnlyOverlay = () => {
    const codeSyncState = useStoreState(state => state.activeProject.codeSyncState);
    const maybeMessage = maybeMessageForSync(codeSyncState);

    if (maybeMessage != null) {
        return (
        <div className="ReadOnlyOverlay">
            <p>{maybeMessage}</p>
        </div>
        );
    }
    return null;
}

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
            return "ERROR";  // TODO: handle better
    }
}
const CodeEditor = () => {
    const { codeTextOrPlaceholder, codeSyncState } = useStoreState(state => ({
        codeTextOrPlaceholder: state.activeProject.codeTextOrPlaceholder,
        codeSyncState: state.activeProject.codeSyncState,
    }));
    const setCodeText = useStoreActions(actions => actions.activeProject.setCodeText);

    const readOnly = (codeSyncState !== SyncState.Syncd);

    return (
      <div className="CodeEditor">
      <AceEditor
        mode="python"
        theme="github"
        value={codeTextOrPlaceholder}
        name="editor"
        fontSize={16}
        width="100%"
        height="100%"
        onChange={setCodeText}
        readOnly={readOnly}
      />
      <ReadOnlyOverlay/>
      </div>
    );
};

export default CodeEditor;