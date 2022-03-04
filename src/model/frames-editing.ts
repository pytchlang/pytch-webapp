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
