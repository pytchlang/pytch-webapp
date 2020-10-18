import React, { createRef, RefObject, useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { ancestorHavingClass } from "../utils";

const EditorWebSocketInfo = () => {
  const text = useStoreState((state) => state.editorWebSocketLog.text);
  const { maybeConnect } = useStoreActions((actions) => actions.reloadServer);
  const contentDivRef: RefObject<HTMLDivElement> = createRef();

  useEffect(() => {
    maybeConnect();
  });

  return (
    <div ref={contentDivRef} className="EditorWebSocketInfo">
      <pre>{text}</pre>
    </div>
  );
};

export default EditorWebSocketInfo;
