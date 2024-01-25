import React from "react";
import FlatEditorThumbnail from "../images/flat-80h.png";
import PerMethodEditorThumbnail from "../images/per-method-80h.png";
import { PytchProgramKind } from "../model/pytch-program";

type EditorKindThumbnailProps = { programKind: PytchProgramKind };
export const EditorKindThumbnail: React.FC<EditorKindThumbnailProps> = ({
  programKind,
}) => {
  const editorKindThumbnail =
    programKind === "flat" ? FlatEditorThumbnail : PerMethodEditorThumbnail;

  return (
    <div className="EditorKindThumbnail">
      <img src={editorKindThumbnail} />
    </div>
  );
};
