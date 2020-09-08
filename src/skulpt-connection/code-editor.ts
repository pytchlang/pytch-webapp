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
};
