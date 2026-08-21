import * as z from "zod/mini";

export const zBuildErrorKey = z.literal([
  "import",
  "create-project",
  "gpio-setup",
  "register-actor.Sprite",
  "register-actor.Stage",
  "unknown",
]);
export type BuildErrorKey = z.infer<typeof zBuildErrorKey>;

export const zOneFrameErrorKey = z.literal(["Sprite", "Stage"]);
export type OneFrameErrorKey = z.infer<typeof zOneFrameErrorKey>;

export const zRenderErrorKey = z.literal(["Sprite", "Stage"]);
export type RenderErrorKey = z.infer<typeof zRenderErrorKey>;

export const zAttributeWatcherErrorKey = z.literal([
  "Sprite",
  "Stage",
  "global",
  "unknown",
]);
export type AttributeWatcherErrorKey = z.infer<
  typeof zAttributeWatcherErrorKey
>;
