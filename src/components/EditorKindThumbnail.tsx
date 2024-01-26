import React from "react";
import FlatEditorThumbnail48 from "../images/flat-48h.png";
import PerMethodEditorThumbnail48 from "../images/per-method-48h.png";
import FlatEditorThumbnail80 from "../images/flat-80h.png";
import PerMethodEditorThumbnail80 from "../images/per-method-80h.png";
import { PytchProgramKind } from "../model/pytch-program";

type EditorKindThumbnailProps = {
  programKind: PytchProgramKind;
  size?: "lg" | "sm";
};
export const EditorKindThumbnail: React.FC<EditorKindThumbnailProps> = ({
  programKind,
  size,
}) => {
  const effectiveSize = size ?? "lg";

  const editorKindThumbnail =
    effectiveSize === "lg"
      ? programKind === "flat"
        ? FlatEditorThumbnail80
        : PerMethodEditorThumbnail80
      : programKind === "flat"
      ? FlatEditorThumbnail48
      : PerMethodEditorThumbnail48;

  return (
    <div className="EditorKindThumbnail">
      <img src={editorKindThumbnail} />
    </div>
  );
};
