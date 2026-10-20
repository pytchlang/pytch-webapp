import * as z from "zod/mini";

export const zBuildErrorKey = z.enum([
  "import",
  "create-project",
  "register-actor.Sprite",
  "register-actor.Stage",
  "unknown",
]);
export type BuildErrorKey = z.infer<typeof zBuildErrorKey>;

export const zOneFrameErrorKey = z.enum(["Sprite", "Stage"]);
export type OneFrameErrorKey = z.infer<typeof zOneFrameErrorKey>;

export const zRenderErrorKey = z.enum(["Sprite", "Stage"]);
export type RenderErrorKey = z.infer<typeof zRenderErrorKey>;

export const zAttributeWatcherErrorKey = z.enum([
  "Sprite",
  "Stage",
  "global",
  "unknown",
]);
export type AttributeWatcherErrorKey = z.infer<
  typeof zAttributeWatcherErrorKey
>;
