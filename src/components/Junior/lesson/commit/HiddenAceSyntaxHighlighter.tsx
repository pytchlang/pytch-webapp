import React from "react";
import { EmptyProps } from "../../../../utils";
import AceEditor from "react-ace";
import { setHiddenHighlighterAceController } from "../../../../skulpt-connection/code-editor";

/** An Ace Editor which is permanently hidden.  Its job is to allow the
 * highlighting of code in exactly the same way that the "real" editors
 * do.  This is done through the `highlightedLines()` method of the
 * `AceController` instance available (when this component is present
 * albeit not displayed) via `getHiddenHighlighterAceController()`. */
export const HiddenAceSyntaxHighlighter: React.FC<EmptyProps> = () => {
  return (
    <AceEditor
      style={{ display: "none" }}
      mode="python"
      theme="github"
      name={`ace-HIDDEN-HIGHLIGHTER`}
      onLoad={setHiddenHighlighterAceController}
    />
  );
};
