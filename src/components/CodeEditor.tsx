import React, { useEffect } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import { useStoreState, useStoreActions } from "../store";
import {
  getFlatAceController,
  setFlatAceController,
} from "../skulpt-connection/code-editor";
import { PytchAceAutoCompleter } from "../skulpt-connection/code-completion";
import { failIfNull } from "../utils";
import { HelpSidebar, HelpSidebarOpenControl } from "./HelpSidebar";
import { equalILoadSaveStatus } from "../model/project";
import { LinkedContentBar } from "./LinkedContentBar";
import { useFlatCodeText } from "./hooks/code-text";
import { eqDisplaySize } from "../model/ui";

const ReadOnlyOverlay = () => {
  const syncState = useStoreState(
    (state) => state.activeProject.syncState,
    equalILoadSaveStatus
  );

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

const CodeAceEditor = () => {
  const codeText = useFlatCodeText("CodeAceEditor");
  const aceRef: React.RefObject<AceEditor> = React.createRef();

  const saveIsPending = useStoreState(
    (state) => state.activeProject.syncState.loadState === "pending"
  );
  const editSeqNum = useStoreState((state) => state.activeProject.editSeqNum);
  const lastSyncFromStorageSeqNum = useStoreState(
    (state) => state.activeProject.lastSyncFromStorageSeqNum
  );

  // We don't care about the actual value of the stage display size, but
  // we do need to know when it changes, so we can resize the editor in
  // our useEffect() call below.
  useStoreState((state) => state.ideLayout.stageDisplaySize, eqDisplaySize);

  useEffect(() => {
    const ace = failIfNull(aceRef.current, "CodeEditor effect: aceRef is null");

    ace.editor.resize();

    ace.editor.commands.addCommand({
      name: "buildAndGreenFlag",
      bindKey: { mac: "Ctrl-Enter", win: "Ctrl-Enter" },
      exec: () => build("running-project"),
    });
    ace.editor.commands.addCommand({
      name: "buildAndGreenFlagKeepFocus",
      bindKey: { mac: "Ctrl-Shift-Enter", win: "Ctrl-Shift-Enter" },
      exec: () => build("editor"),
    });
    ace.editor.commands.addCommand({
      name: "copySelectionAsHtml",
      bindKey: { mac: "Cmd-Shift-c", win: "Ctrl-Shift-c" },
      exec: async () => {
        await getFlatAceController()?.copySelectionAsHtml();
      },
    });

    // It seems common to have not ever heard of "overwrite" mode.  If
    // it gets turned on by mistake, people often get confused.  Ensure
    // we are in "insert" mode, and also remove any bindings for the
    // command which toggles overwrite.
    ace.editor.session.setOverwrite(false);
    ace.editor.commands.removeCommand("overwrite", true);

    if (editSeqNum === lastSyncFromStorageSeqNum) {
      ace.editor.session.getUndoManager().reset();
    }
  });

  const { build, setCodeText, noteCodeChange } = useStoreActions(
    (actions) => actions.activeProject
  );

  const updateCodeText = (text: string) => {
    setCodeText(text);
    noteCodeChange();
  };

  // (The cast "as any" is because the "enableBasicAutocompletion" prop
  // is typed as taking either a boolean or an array of strings, whereas
  // it will in fact take an array of class instances, which is how we
  // use it here.)
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completers = [new PytchAceAutoCompleter() as any];

  return (
    <>
      <AceEditor
        ref={aceRef}
        mode="python"
        theme="github"
        enableBasicAutocompletion={completers}
        value={codeText}
        name="pytch-ace-editor"
        fontSize={16}
        width="100%"
        height="100%"
        onLoad={setFlatAceController}
        onChange={updateCodeText}
        readOnly={saveIsPending}
      />
      <ReadOnlyOverlay />
    </>
  );
};

const CodeEditor = () => {
  return (
    <div className="CodeEditor">
      <LinkedContentBar />
      <div className="editor-itself">
        <div className="help-sidebar">
          <HelpSidebar />
          <HelpSidebarOpenControl />
        </div>
        <CodeAceEditor />
      </div>
    </div>
  );
};

export default CodeEditor;
