import React from "react";

import { Editable, Frame as FrameT } from "../../model/frames-editing";
import { CommentFrame } from "./CommentFrame";

const componentFromKind = {
  comment: CommentFrame,
  // TODO: Add
  //
  // assignment: AssignmentFrame
  //
  // etc. when implemented.
};

const FrameContent: React.FC<Editable<FrameT>> = (props) => {
  const mComponent = componentFromKind[props.frame.kind];
  if (mComponent != null) {
    // Need "as any" because TypeScript can't work out that the runtime
    // behaviour will be for the types to match.
    return React.createElement(mComponent as any, props, null);
  } else {
    return <div>UNKNOWN FRAME-KIND!?</div>;
  }
};
