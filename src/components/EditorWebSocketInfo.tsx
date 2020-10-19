import React, { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";

const EditorWebSocketInfo = () => {
  const text = useStoreState((state) => state.editorWebSocketLog.text);
  const { maybeConnect } = useStoreActions((actions) => actions.reloadServer);

  useEffect(() => {
    maybeConnect();
  });

  return (
    <div className="EditorWebSocketInfo">
      <pre>{text}</pre>
    </div>
  );
};

export default EditorWebSocketInfo;
