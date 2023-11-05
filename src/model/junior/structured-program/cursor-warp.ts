// Warping cursor to error in currently-not-focused actor.
//
// Has the user clicked on a "go to location" button?  Sometimes this
// will involve selecting a different Actor, in which case we have to
// store somewhere the fact that we want to warp the relevant Ace cursor
// once that AceEditor has been loaded.

import { Uuid } from "./core-types";

/** Description of where "the cursor" should be warped to when the
 * chance arises, in terms of which line/col of the editor for which
 * handler.  Each individual editor has its own cursor, so "the cursor"
 * here means the cursor of the focused editor.  */
type CursorWarpTarget = {
  handlerId: Uuid;
  lineNo: number;
  colNo: number | null;
};

/** Whether there is an outstanding task of activating a particular
 * handler's editor and warping its cursor to a particular location. */
export class PendingCursorWarp {
  target: CursorWarpTarget | null = null;

  /** Set the current pending cursor-warp target.  This can be acquired
   * later via `acquireIfForHandler()`. */
  set(target: CursorWarpTarget) {
    if (this.target != null) {
      console.warn(
        `setting warp target while one already pending:`,
        this.target
      );
    }

    this.target = target;
  }

  /** If the current pending cursor warp target (as set by `set()`) is
   * for the given `handlerId`, then return that warp target, also
   * _acquiring_ it, i.e., taking ownership of it from `this`, leaving
   * `this` with no live warp target.
   *
   * Otherwise, return `null`. */
  acquireIfForHandler(handlerId: Uuid): CursorWarpTarget | null {
    if (this.target != null && this.target.handlerId === handlerId) {
      const acquiredTarget = this.target;
      this.target = null;
      return acquiredTarget;
    }

    return null;
  }
}
