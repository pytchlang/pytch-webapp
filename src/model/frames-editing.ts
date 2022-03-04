import { Action, action, Actions } from "easy-peasy";
import { assertNever } from "../utils";

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

// This type will mostly be used further below (in makeEditable), but I
// define it here so I don't have to repeat myself about the valid
// values for the "status" property.
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

  // TODO:
  //
  // insertFrameBefore: Action<IFramesEditor, InsertionDescriptor>;
  //
  // where the type InsertionDescriptor has properties for the
  // to-be-inserted frame and for the frame (maybe by ID?) before which
  // the new frame is to be inserted.  For appending a frame to the
  // whole list, the "frame before which to insert the new frame" can be
  // null.
  //
  // Could consider renaming to "moveFrameBefore", where the
  // to-be-inserted frame is removed from its current place in the list
  // if it's already in the list.  Or just have a separate
  // "moveFrameBefore" action.  Gets a bit more complicated if you want
  // to be able to move frames from within the body-suite of a "while"
  // to top-level.
  //
  // Likely to be some thought needed about how to handle frame kinds
  // which have nested suites of code, e.g., WhileLoopFrame or
  // IfElseFrame.

  // TODO:
  // setFramesFromJSON: Action<IFramesEditor, string>;

  // TODO:
  // framesAsJSON: Computed<IFramesEditor, string>;

  // TODO:
  // framesAsPython: Computed<IFramesEditor, string>;
}

const frameIndexByIdOrFail = (
  frames: Array<PreEditableFrame>,
  targetId: number
) => {
  const frameIndex = frames.findIndex((f) => f.id === targetId);
  if (frameIndex === -1)
    throw new Error(`could not find frame with id ${targetId}`);
  return frameIndex;
};

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

  editFrame: action((state, frame) => {
    const frameIndex = frameIndexByIdOrFail(state.frames, frame.id);
    state.frames[frameIndex].editStatus = "being-edited";
  }),

  saveFrame: action((state, replaceDescriptor) => {
    const frameIndex = frameIndexByIdOrFail(
      state.frames,
      replaceDescriptor.idToReplace
    );
    state.frames[frameIndex] = {
      ...replaceDescriptor.newFrame,
      editStatus: "saved",
    };
  }),

  deleteFrame: action((state, frame) => {
    // TODO.
  }),
};

////////////////////////////////////////////////////////////////////////
// Bridge between Easy-Peasy and React-props worlds

export type Editable<Frame> = {
  frame: Frame;
  editState: EditState;
};

/**
 * Combine the given pre-editable-frame with the given actions to
 * produce an "editable frame", i.e., one which includes functions to
 * take the appropriate actions based on the frame's edit-status:  A
 * "saved" frame can be edited or deleted; a "being-edited" frame can be
 * saved or deleted.
 * @param frame
 * @param actions
 * @returns editableFrame
 */
export const makeEditable = (
  frame: PreEditableFrame,
  actions: Actions<IFramesEditor>
): Editable<Frame> => {
  const bareFrame: Frame = Object.assign({}, frame);
  delete (bareFrame as any).editStatus;

  switch (frame.editStatus) {
    case "saved":
      return {
        frame: bareFrame,
        editState: {
          status: "saved",
          edit: () => actions.editFrame(bareFrame),
          delete: () => actions.deleteFrame(bareFrame),
        },
      };
    case "being-edited":
      return {
        frame: bareFrame,
        editState: {
          status: "being-edited",
          save: (replacementFrame) =>
            actions.saveFrame({
              idToReplace: bareFrame.id,
              newFrame: replacementFrame,
            }),
          delete: () => actions.deleteFrame(bareFrame),
        },
      };
    default:
      return assertNever(frame.editStatus);
  }
};
