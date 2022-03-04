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
      save: (newFrame: Frame) => void;
      // TODO: cancel: () => void;
      delete: () => void;
    }
  | {
      status: "saved";
      edit: () => void;
      delete: () => void;
    };
