import React from "react";

import { Editable, Frame as FrameT } from "../../model/frames-editing";
import { Frame } from "./Frame";

export type CodeAsFramesProps = {
  frames: Array<Editable<FrameT>>;
};

export const CodeAsFrames: React.FC<CodeAsFramesProps> = (props) => {
  const frames = props.frames.map((f) => <Frame {...f} key={f.frame.id} />);
  return <div className="frames-editor">{frames}</div>;
};
