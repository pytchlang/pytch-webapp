/** This is an unpleasant fudge to allow us to move the editor's cursor
 * to a particular line. */

import { IAceEditorProps } from "react-ace";
import { PYTCH_CYPRESS } from "../utils";
import { SourceMap } from "../model/junior/structured-program";

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
}

export let aceController: AceController | null = null;
export const setAceController = (editor: AceEditorT) => {
  aceController = new AceController(editor);

  // To aid testing, allow direct access to the editor interface for
  // setting project text.  This was not the first thing I tried and
  // it's not particularly clean, but it seems to be working.
  PYTCH_CYPRESS()["ACE_CONTROLLER"] = editor;
};

export let liveSourceMap = new SourceMap();
