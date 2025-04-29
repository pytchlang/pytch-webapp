import { assertNever } from "../utils";
import { ActorKind } from "./junior/structured-program";

type PerMethodDevWorkContext = {
  programKind: "per-method";
  actorKind: ActorKind;
};

/** In what context is the user doing this piece of development work?
 * This affects the help text we show for a particular block (e.g.,
 * "flat" help might mention having to do "import math" whereas
 * "per-method" does that import behind the scenes) and also which
 * blocks are shown (e.g., if editing a "per-method" program, don't show
 * Sprite-only blocks when the Stage is active).  It also affects the
 * list of completions we provide in the code editor. */
export type DevWorkContext = { programKind: "flat" } | PerMethodDevWorkContext;

export type DevWorkContextFlatKey = "flat" | `per-method-${ActorKind}`;

export class DevWorkContextOps {
  static asFlatKey(ctx: DevWorkContext): DevWorkContextFlatKey {
    switch (ctx.programKind) {
      case "flat":
        return "flat";
      case "per-method":
        return `per-method-${ctx.actorKind}`;
      default:
        return assertNever(ctx);
    }
  }
}
