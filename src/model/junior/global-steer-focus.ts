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
  | "gfs__help" // Activity sidebar
  | "gfs__flatassets" // Images and sounds ("flat")
  | "gfs__actors" // Stage and sprites ("per-method")
  | "gfs__actorprops"; // Code (scripts) / costumes / sounds ("per-method")

type GlobalFocusAction =
  | {
      kind: "bookmarked-item";
      stem: GlobalFocusTargetStem;
    }
  | {
      kind: "element";
      selector: string;
    }
  | {
      kind: "bookmarked-item-or-element";
      stem: GlobalFocusTargetStem;
      selector: string;
    };

const bookmarkedAction = (stem: GlobalFocusTargetStem): GlobalFocusAction => ({
  kind: "bookmarked-item",
  stem,
});

const elementAction = (selector: string): GlobalFocusAction => ({
  kind: "element",
  selector,
});

const bookmarkedOrElementAction = (
  stem: GlobalFocusTargetStem,
  selector: string
): GlobalFocusAction => ({
  kind: "bookmarked-item-or-element",
  stem,
  selector,
});

type KeyDownOutcome = "triggered-action" | "did-nothing";

export class GlobalFocusSteering {
  state: State;
  actionFromSecondKey: Map<string, GlobalFocusAction>;
  groupedFocusManager: GroupedFocusManager;

  constructor(
    pageKind: FocusContextPageKind,
    groupedFocusManager: GroupedFocusManager
  ) {
    this.state = kIdleState;
    this.actionFromSecondKey = new Map();
    this.groupedFocusManager = groupedFocusManager;

    this.actionFromSecondKey.set("p", elementAction("#pytch-speech-bubbles"));

    switch (pageKind) {
      case "per-method":
        this.actionFromSecondKey.set("h", bookmarkedAction("gfs__help"));
        this.actionFromSecondKey.set("s", bookmarkedAction("gfs__actors"));
        this.actionFromSecondKey.set("c", bookmarkedAction("gfs__actorprops"));
        break;
      case "flat":
        this.actionFromSecondKey.set("h", bookmarkedAction("gfs__help"));
        this.actionFromSecondKey.set("a", bookmarkedAction("gfs__flatassets"));
        this.actionFromSecondKey.set(
          "c",
          elementAction("#pytch-ace-editor textarea")
        );
        break;
      case "my-projects-list":
        break;
      default:
        assertNever(pageKind);
    }
  }

  maybeAction(key: string, timestamp: number) {
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
          return this.actionFromSecondKey.get(keyLowerCase);
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

  static nItemsInGroup(stem: GlobalFocusTargetStem) {
    const containerElt = GlobalFocusSteering.containerEltFromStem(stem);
    return GroupedFocusManager.nItemsInGroup(containerElt);
  }

  onKeyDown(key: string, timestamp: number): KeyDownOutcome {
    const mAction = this.maybeAction(key, timestamp);
    if (mAction == null) {
      // User typed something not triggering global focus steering.
      return "did-nothing";
    }

    switch (mAction.kind) {
      case "bookmarked-item":
        this.focusBookmarkedItem(mAction.stem);
        return "triggered-action";
      case "element": {
        const mElement = document.querySelector<HTMLElement>(mAction.selector);
        mElement?.focus();
        return "triggered-action";
      }
      case "bookmarked-item-or-element": {
        if (GlobalFocusSteering.containerEltOfStemExists(mAction.stem)) {
          this.focusBookmarkedItem(mAction.stem);
        } else {
          const mElement = document.querySelector<HTMLElement>(
            mAction.selector
          );
          mElement?.focus();
        }
        return "triggered-action";
      }
      default:
        return assertNever(mAction);
    }
  }
}
