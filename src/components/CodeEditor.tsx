import React, { useEffect } from "react";
import AceEditor from "react-ace";
import { useStoreState, useStoreActions } from "../store";
import {
  AceEditorT,
  getFlatAceController,
  setFlatAceController,
} from "../skulpt-connection/code-editor";
import { PytchAceAutoCompleter } from "../skulpt-connection/code-completion";
import { failIfNull } from "../utils";
import { useFlatCodeText } from "./hooks/code-text";
import { eqDisplaySize } from "../model/ui";
import { SingleTab } from "./SingleTab";

const ReadOnlyOverlay = () => {
  const maybeMessage = useStoreState((state) => {
    const syncState = state.activeProject.syncState;
    // TODO: Handle "failed" state.
    return syncState.loadState === "pending"
      ? "Loading..."
      : syncState.saveState === "pending"
      ? "Saving..."
      : null;
  });

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

  const { build, setCodeText } = useStoreActions(
    (actions) => actions.activeProject
  );

  const updateCodeText = (text: string) => {
    setCodeText(text);
  };

  // (The cast "as any" is because the "enableBasicAutocompletion" prop
  // is typed as taking either a boolean or an array of strings, whereas
  // it will in fact take an array of class instances, which is how we
  // use it here.)
  //
  const completers = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new PytchAceAutoCompleter({ programKind: "flat" }) as any,
  ];

  const onAceLoad = (editor: AceEditorT) => {
    setFlatAceController(editor);
    const textarea = failIfNull(
      document.querySelector<HTMLTextAreaElement>("#pytch-ace-editor textarea"),
      "could not find textarea"
    );
    textarea.tabIndex = -1;
  };

  return (
    <>
      <AceEditor
        ref={aceRef}
        mode="python"
        theme="pytch"
        enableBasicAutocompletion={completers}
        value={codeText}
        name="pytch-ace-editor"
        fontSize={14}
        width="100%"
        height="100%"
        onLoad={onAceLoad}
        onChange={updateCodeText}
        readOnly={saveIsPending}
      />
      <ReadOnlyOverlay />
    </>
  );
};

export const CodeEditor = () => {
  return (
    <div className="CodeEditor compact-tablist-container">
      <SingleTab title="Code">
        <div className="abs-0000">
          <CodeAceEditor />
        </div>
      </SingleTab>
    </div>
  );
};
