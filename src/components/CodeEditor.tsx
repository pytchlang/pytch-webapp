import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import { useStoreState, useStoreActions } from '../store';
import { SyncState } from "../model/project";


type MaybeString = string | null;

const ReadOnlyOverlay: React.FC<{maybeMessage: MaybeString}> = (props) => {
    if (props.maybeMessage != null) {
        return (
        <div className="ReadOnlyOverlay">
            <p>{props.maybeMessage}</p>
        </div>
        );
    }
    console.log("no overlay");
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
    const syncIndicatorMessage = maybeMessageForSync(codeSyncState);

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
      <ReadOnlyOverlay maybeMessage={syncIndicatorMessage}/>
      </div>
    );
};

export default CodeEditor;