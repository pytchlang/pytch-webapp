import { Action, action, Actions } from "easy-peasy";

////////////////////////////////////////////////////////////////////////

type FrameBase<KindLiteral extends string> = {
  id: number;
  kind: KindLiteral;
};

const nextId = (() => {
  let id = 10000;
  return () => id++;
})();

////////////////////////////////////////////////////////////////////////
// Comment

type CommentCore = {
  commentText: string;
};

export type CommentFrame = FrameBase<"comment"> & CommentCore;

export const makeCommentFrame = (core: CommentCore): CommentFrame => ({
  id: nextId(),
  kind: "comment",
  ...core,
});

////////////////////////////////////////////////////////////////////////
// Assignment

type AssignmentCore = {
  variableName: string;
  valueText: string;
};

// TODO:
//
// export type AssignmentFrame = ...
// export const makeAssignmentFrame = ...

////////////////////////////////////////////////////////////////////////
// All frame kinds

// TODO: Uncomment AssignmentFrame; add other frame types when done.

export type Frame = /* AssignmentFrame | WhileLoopFrame | ... | */ CommentFrame;

////////////////////////////////////////////////////////////////////////
// Editing a frame

// This is all a bit cumbersome because I'm trying to bridge the purely
// functional world of props-based React components with the "one huge
// global variable" world of Easy-Peasy.

// The type of the EditState.save() function (below) when in state
// "being-edited" could be tighter, because we only want to update the
// frame with one of the same kind.  But I spent too long down the
// rabbit-hole of how to explain this to the TypeScript type system
// without getting to a good answer!
export type EditState =
  | {
      status: "being-edited";
      // If the frame is currently being edited, then we can do the
      // following things to it:
      save: (newFrame: Frame) => void;
      // TODO: cancel: () => void;
      delete: () => void;
    }
  | {
      status: "saved";
      // If the frame is currently "saved" (not being edited), then we
      // can do the following things to it:
      edit: () => void;
      delete: () => void;
    };

// A frame along with the information as to whether it's being edited or
// is saved, but without the functions to save / cancel / delete /
// begin-editing.
export type PreEditableFrame = Frame & {
  editStatus: EditState["status"];
};

// Information required when replacing a frame (i.e., when the user
// clicks "SAVE" to finish editing a frame).
type ReplaceFrameDescriptor = {
  idToReplace: number;
  newFrame: Frame;
};

// The type of the model slice within the huge Easy-Peasy-based global
// variable.
export interface IFramesEditor {
  frames: Array<PreEditableFrame>;

  /** Set the frame within state.frames with ID matching that of the
   * passed-in frame to "being-edited" mode. */
  editFrame: Action<IFramesEditor, Frame>;

  /** Replace the frame within state.frames having the given ID with the
   * given replacement frame, noting its status as "saved". */
  saveFrame: Action<IFramesEditor, ReplaceFrameDescriptor>;

  /** Remove the frame within state.frames with ID matching that of
   * passed-in frame. */
  deleteFrame: Action<IFramesEditor, Frame>;
}

// Value of the model slice when the app starts up.
export const framesEditor: IFramesEditor = {
  // Sample data to develop with; in the final thing this will be
  // instead be
  //
  // frames: []
  //
  // so the editor starts empty.
  frames: [
    {
      id: 1001,
      kind: "comment",
      commentText: "Hello world!",
      editStatus: "saved",
    },
    {
      id: 1002,
      kind: "comment",
      commentText: "Hello again world!",
      editStatus: "saved",
    },
  ],
};
