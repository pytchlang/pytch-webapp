/** This is an unpleasant fudge to allow us to move the editor's cursor
 * to a particular line. */

import { IAceEditorProps } from "react-ace";
import { PYTCH_CYPRESS } from "../utils";
import { SourceMap, Uuid } from "../model/junior/structured-program";
import { PendingCursorWarp } from "../model/junior/structured-program";

import {
  lineAsElement,
  lineIntersectsSelection,
} from "../model/highlight-as-ace";

// Is this defined somewhere I can get at it?
export type AceEditorT = Parameters<Required<IAceEditorProps>["onLoad"]>[0];

class AceController {
  constructor(readonly editor: AceEditorT) {}

  gotoLocation(lineNo: number, colNo: number | null) {
    if (colNo == null) {
      this.gotoLine(lineNo);
    } else {
      this.gotoLineAndColumn(lineNo, colNo);
    }
  }

  gotoLine(lineNo: number) {
    this.editor.gotoLine(lineNo, 0, true);
    this.focus();
  }

  gotoLineAndColumn(lineNo: number, colNo: number) {
    this.editor.gotoLine(lineNo, colNo, true);
    this.focus();
  }

  focus() {
    this.editor.focus();
  }

  async copySelectionAsHtml() {
    let preElt = document.createElement("pre");
    preElt.setAttribute("style", "font-family:monospace;");

    const selection = this.editor.getSelection().getAllRanges();
    const nLines = this.editor.session.getDocument().getLength();
    for (let i = 0; i !== nLines; ++i) {
      if (!lineIntersectsSelection(i, selection)) {
        continue;
      }

      const tokens = this.editor.session.getTokens(i);
      const codeElt = lineAsElement(tokens);
      preElt.appendChild(codeElt);
      preElt.appendChild(document.createTextNode("\n"));
    }

    const type = "text/html";
    const blob = new Blob([preElt.outerHTML], { type });
    const items = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(items);
  }
}

// Uuid is already just string, but this expresses the intent:
type EditorId = Uuid | "flat";

class AceControllerMap {
  controllerFromHandlerId: Map<EditorId, AceController>;

  constructor() {
    this.controllerFromHandlerId = new Map<Uuid, AceController>();
  }

  set(editorId: EditorId, editor: AceEditorT) {
    const controller = new AceController(editor);
    this.controllerFromHandlerId.set(editorId, controller);

    // Special-case the situation where we set the "flat" controller, to
    // allow existing tests to keep working.  The below allows direct
    // access to the editor interface for setting flat project text.
    // This was not the first thing I tried and it's not particularly
    // clean, but it seems to be working.
    if (editorId === "flat") {
      PYTCH_CYPRESS()["ACE_CONTROLLER"] = editor;
    }

    return controller;
  }

  get(editorId: EditorId) {
    // Return null rather than undefined:
    return this.controllerFromHandlerId.get(editorId) ?? null;
  }

  deleteExcept(keepEditorIds: Array<EditorId>) {
    // Probably not worth converting the given Ids to a map, since we
    // don't expect very many of them.
    const allIds = Array.from(this.controllerFromHandlerId.keys());
    allIds.forEach((editorId) => {
      if (!keepEditorIds.includes(editorId)) {
        this.controllerFromHandlerId.delete(editorId);
      }
    });
  }

  clear() {
    this.controllerFromHandlerId.clear();
  }
}

export let aceControllerMap = new AceControllerMap();

export const getFlatAceController = () => aceControllerMap.get("flat");
export const setFlatAceController = (editor: AceEditorT) =>
  aceControllerMap.set("flat", editor);

export let liveSourceMap = new SourceMap();
export let pendingCursorWarp = new PendingCursorWarp();
