/** This is an unpleasant fudge to allow us to move the editor's cursor
 * to a particular line. */

import { IAceEditorProps } from "react-ace";
import { PYTCH_CYPRESS } from "../utils";

import {
  lineAsElement,
  lineIntersectsSelection,
} from "../model/highlight-as-ace";

// Is this defined somewhere I can get at it?
export type AceEditorT = Parameters<Required<IAceEditorProps>["onLoad"]>[0];

class AceController {
  constructor(readonly editor: AceEditorT) {}

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

export let aceController: AceController | null = null;
export const setAceController = (editor: AceEditorT) => {
  aceController = new AceController(editor);

  // To aid testing, allow direct access to the editor interface for
  // setting project text.  This was not the first thing I tried and
  // it's not particularly clean, but it seems to be working.
  PYTCH_CYPRESS()["ACE_CONTROLLER"] = editor;
};
