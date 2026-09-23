import { FocusContextPageKind } from "../../components/hooks/focus-steering";
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
  | "gfs__projects" // "My projects" list --- not yet a global "go to" binding
  | "gfs__help" // Activity tab-bar (if content collapsed) or help content
  | "gfs__activitytabbar" // Activity tab-bar (always)
  | "gfs__flatassets" // Images and sounds ("flat")
  | "gfs__actors" // Stage and sprites ("per-method")
  | "gfs__actorprops"; // Code (scripts) / costumes / sounds ("per-method")

type KeyDownOutcome = "triggered-action" | "did-nothing";

// TODO: The output pane should be a focus target, so it can be read,
// and scrolled by keyboard.

export type SkipLinkFocusTarget =
  | "activity-tab-bar"
  | "project-stage"
  | "per-method-actors"
  | "per-method-actor-props"
  | "flat-code"
  | "flat-assets";

type GlobalFocusTarget = SkipLinkFocusTarget | "activity-tab-bar-or-content";

export class GlobalFocusSteering {
  state: State;
  targetFromSecondKey: Map<string, GlobalFocusTarget>;
  groupedFocusManager: GroupedFocusManager;

  constructor(
    pageKind: FocusContextPageKind,
    groupedFocusManager: GroupedFocusManager
  ) {
    this.state = kIdleState;
    this.targetFromSecondKey = new Map();
    this.groupedFocusManager = groupedFocusManager;

    switch (pageKind) {
      case "per-method":
        this.targetFromSecondKey.set("p", "project-stage");
        this.targetFromSecondKey.set("h", "activity-tab-bar-or-content");
        this.targetFromSecondKey.set("s", "per-method-actors");
        this.targetFromSecondKey.set("c", "per-method-actor-props");
        break;
      case "flat":
        this.targetFromSecondKey.set("p", "project-stage");
        this.targetFromSecondKey.set("h", "activity-tab-bar-or-content");
        this.targetFromSecondKey.set("a", "flat-assets");
        this.targetFromSecondKey.set("c", "flat-code");
        break;
      case "my-projects-list":
      case "demos-list":
        break;
      default:
        assertNever(pageKind);
    }
  }

  maybeTarget(key: string, timestamp: number) {
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
          return this.targetFromSecondKey.get(keyLowerCase);
        }
      }
    }
  }

  static containerEltOfStemExists(stem: GlobalFocusTargetStem) {
    const containerClass = `${stem}__container`;
    const clsElts = document.getElementsByClassName(containerClass);
    return clsElts.length !== 0;
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

  focusAbsoluteItem(stem: GlobalFocusTargetStem, index: number) {
    const containerElt = GlobalFocusSteering.containerEltFromStem(stem);
    this.groupedFocusManager.focusAbsoluteItem(containerElt, index);
  }

  focusElement(selector: string) {
    const mElement = document.querySelector<HTMLElement>(selector);
    mElement?.focus();
  }

  static nItemsInGroup(stem: GlobalFocusTargetStem) {
    const containerElt = GlobalFocusSteering.containerEltFromStem(stem);
    return GroupedFocusManager.nItemsInGroup(containerElt);
  }

  onKeyDown(key: string, timestamp: number): KeyDownOutcome {
    const mTarget = this.maybeTarget(key, timestamp);
    if (mTarget == null) {
      // User typed something not triggering global focus steering.
      return "did-nothing";
    }

    this.focusGlobalFocusTarget(mTarget);
    return "triggered-action";
  }

  focusGlobalFocusTarget(target: GlobalFocusTarget) {
    switch (target) {
      case "activity-tab-bar":
        this.focusBookmarkedItem("gfs__activitytabbar");
        break;
      case "activity-tab-bar-or-content":
        if (GlobalFocusSteering.containerEltOfStemExists("gfs__help")) {
          this.focusBookmarkedItem("gfs__help");
        } else {
          this.focusElement(".gfs__help-content");
        }
        break;
      case "project-stage":
        this.focusElement("#pytch-speech-bubbles");
        break;
      case "per-method-actors":
        this.focusBookmarkedItem("gfs__actors");
        break;
      case "per-method-actor-props":
        this.focusBookmarkedItem("gfs__actorprops");
        break;
      case "flat-code":
        this.focusElement("#pytch-ace-editor textarea");
        break;
      case "flat-assets":
        this.focusBookmarkedItem("gfs__flatassets");
        break;
      default:
        assertNever(target);
    }
  }
}
