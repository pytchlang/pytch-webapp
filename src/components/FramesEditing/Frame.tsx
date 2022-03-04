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
