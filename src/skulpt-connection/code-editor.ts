/** This is an unpleasant fudge to allow us to move the editor's cursor
 * to a particular line. */

import { IAceEditor } from "react-ace/lib/types";

class AceController {
  constructor(readonly editor: IAceEditor) {}

  gotoLine(lineNo: number) {
    this.editor.gotoLine(lineNo, 0, true);
    this.editor.focus();
  }
}

export let aceController: AceController | null = null;
export const setAceController = (editor: IAceEditor) => {
  aceController = new AceController(editor);

  // To aid testing, allow direct access to the editor interface for
  // setting project text.  This was not the first thing I tried and
  // it's not particularly clean, but it seems to be working.
  (window as any)["PYTCH_CYPRESS_ACE_CONTROLLER"] = editor;
};
