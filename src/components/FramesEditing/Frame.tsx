import React from "react";
import Button from "react-bootstrap/Button";

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

export const Frame: React.FC<Editable<FrameT>> = (props) => {
  const buttons = ((editState) => {
    switch (editState.status) {
      case "saved":
        return (
          <>
            <Button onClick={editState.edit}>EDIT</Button>
            <Button onClick={editState.delete}>DEL</Button>
          </>
        );
      case "being-edited":
        // "SAVE" button is part of concrete frame component.
        return (
          <>
            <Button onClick={editState.delete}>DEL</Button>
          </>
        );
    }
  })(props.editState);

  return (
    <div className="frame">
      <div className="code-content">
        <FrameContent {...props} />
      </div>
      <div className="buttons">{buttons}</div>
    </div>
  );
};
