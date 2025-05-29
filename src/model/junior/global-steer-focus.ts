import { groupedFocusManager } from "./grouped-focus";

/** Machinery for allowing a two-key sequence to send focus to a small
 * set of target "focus group"s.  The user can type, e.g., "g h" to send
 * focus to (the currently bookmarked item within the) help sidebar.
 *
 * The focus-group can be specified more finely than the global
 * key-sequence targets.  E.g., the global focus target is just "the
 * code/costumes/sounds pane", whereas the focus-group key distinguishes
 * between individual actors and also between code vs costumes vs
 * sounds. Therefore, the global focus targets are identified by giving
 * the appropriate element a particular class.
 *
 * The actual job of sending focus to the correct element is delegated
 * to the "focus group" machinery; see `GroupedFocusManager`.
 * */

type State =
  | { kind: "idle" }
  | { kind: "intro-key-received"; expiryTime: number };

const kIdleState: State = { kind: "idle" };

const kKeySequenceTimeout = 1.0;
const kIntroKeyLowerCase = "g";

export type GlobalFocusTargetStem =
  | "gfs__help" // Activity sidebar
  | "gfs__actors" // Stage and sprites
  | "gfs__actorprops"; // Code (scripts) / costumes / sounds

export class GlobalFocusSteering {
  state: State;
  classFromSecondKey: Map<string, GlobalFocusTargetStem>;

  constructor() {
    this.state = kIdleState;
    this.classFromSecondKey = new Map([
      ["h", "gfs__help"],
      ["s", "gfs__actors"],
      ["c", "gfs__actorprops"],
    ]);
  }

  targetStem(key: string, timestamp: number) {
    const keyLowerCase = key.toLowerCase();

    switch (this.state.kind) {
      case "idle":
        if (keyLowerCase === kIntroKeyLowerCase) {
          this.state = {
            kind: "intro-key-received",
            expiryTime: timestamp + kKeySequenceTimeout,
          };
        }
        return null;
      case "intro-key-received": {
        if (timestamp >= this.state.expiryTime) {
          this.state = kIdleState;
          return null;
        } else {
          this.state = kIdleState;
          return this.classFromSecondKey.get(keyLowerCase);
        }
      }
    }
  }

  static containerEltFromStem(stem: GlobalFocusTargetStem) {
    const containerClass = `${stem}__container`;
    const mElt = document.getElementsByClassName(
      containerClass
    )[0] as HTMLElement;
    if (mElt == null) {
      throw new Error(
        `containerEltFromStem(): no elt with class ${containerClass}`
      );
    }
    return mElt;
  }

  // This could be static but it keeps things simpler to leave it as an
  // instance method.
  focusBookmarkedItem(stem: GlobalFocusTargetStem) {
    const containerElt = GlobalFocusSteering.containerEltFromStem(stem);
    groupedFocusManager.focusBookmarkedItem(containerElt);
  }

  onKeyDown(key: string, timestamp: number) {
    const mStem = this.targetStem(key, timestamp);
    if (mStem == null) {
      // User typed something not triggering global focus steering.
      return;
    }

    this.focusBookmarkedItem(mStem);
  }
}

// TODO: Would it be more React-y to put this in a Context provided by a
// fairly high-up component in the tree for the IDE?
export let globalFocusSteering = new GlobalFocusSteering();
