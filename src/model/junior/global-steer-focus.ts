import { PytchProgramKind } from "../pytch-program";
import { GroupedFocusManager } from "./grouped-focus";
import { assertNever } from "../../utils";

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
  | "gfs__flatassets" // Images and sounds ("flat")
  | "gfs__actors" // Stage and sprites ("per-method")
  | "gfs__actorprops"; // Code (scripts) / costumes / sounds ("per-method")

export class GlobalFocusSteering {
  state: State;
  classFromSecondKey: Map<string, GlobalFocusTargetStem>;
  groupedFocusManager: GroupedFocusManager;

  constructor(
    programKind: PytchProgramKind,
    groupedFocusManager: GroupedFocusManager
  ) {
    this.state = kIdleState;
    this.classFromSecondKey = new Map();
    this.groupedFocusManager = groupedFocusManager;

    switch (programKind) {
      case "per-method":
        this.classFromSecondKey.set("h", "gfs__help");
        this.classFromSecondKey.set("s", "gfs__actors");
        this.classFromSecondKey.set("c", "gfs__actorprops");
        break;
      case "flat":
        this.classFromSecondKey.set("h", "gfs__help");
        this.classFromSecondKey.set("a", "gfs__flatassets");
        break;
      default:
        assertNever(programKind);
    }
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
    const clsElts = document.getElementsByClassName(containerClass);
    const mElt = clsElts[0] as HTMLElement;
    if (mElt == null) {
      throw new Error(
        `containerEltFromStem(): no elt with class ${containerClass}`
      );
    }
    return mElt;
  }

  focusBookmarkedItem(stem: GlobalFocusTargetStem) {
    const containerElt = GlobalFocusSteering.containerEltFromStem(stem);
    this.groupedFocusManager.focusBookmarkedItem(containerElt);
  }

  onKeyDown(key: string, timestamp: number) {
    const mStem = this.targetStem(key, timestamp);
    if (mStem == null) {
      // User typed something not triggering global focus steering.
      return;
    }

    // TODO: Will need to be generalised to handle "flat" projects,
    // where "go to code" should focus the (only) Ace editor textarea.
    this.focusBookmarkedItem(mStem);
  }
}
