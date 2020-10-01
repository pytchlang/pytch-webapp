import React, { createRef, RefObject, useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { ancestorHavingClass } from "../utils";

const EditorWebSocketInfo = () => {
  const text = useStoreState((state) => state.editorWebSocketLog.text);
  const { maybeConnect } = useStoreActions((actions) => actions.reloadServer);
  const contentDivRef: RefObject<HTMLDivElement> = createRef();

  useEffect(() => {
    maybeConnect();

    // Always show the most recent log messages.
    const contentDiv = contentDivRef.current;
    if (contentDiv != null) {
      const scrollDiv = ancestorHavingClass(contentDiv, "tab-content");
      scrollDiv.scrollTo(0, scrollDiv.scrollHeight);
    }
  });

  return (
    <div ref={contentDivRef} className="EditorWebSocketInfo">
      <pre>{text}</pre>
    </div>
  );
};

export default EditorWebSocketInfo;
