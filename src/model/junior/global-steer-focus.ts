import { GroupedFocusManager, groupedFocusManager } from "./grouped-focus";

type State =
  | { kind: "idle" }
  | { kind: "intro-key-received"; expiryTime: number };

const idleState: State = { kind: "idle" };

const validityDuration = 1.0;
const introKeyLowerCase = "g";

export type GlobalFocusTargetStem =
  | "gfs__help" // Activity sidebar
  | "gfs__actors" // Stage and sprites
  | "gfs__actorprops"; // Code (scripts) / costumes / sounds

export type MaybeGlobalFocusTargetClass = GlobalFocusTargetStem | undefined;

export class GlobalFocusSteering {
  state: State;
  classFromSecondKey: Map<string, GlobalFocusTargetStem>;

  constructor() {
    this.state = idleState;
    this.classFromSecondKey = new Map();
  }

  registerBinding(secondKey: string, cls: GlobalFocusTargetStem) {
    this.classFromSecondKey.set(secondKey, cls);
  }

  targetStem(key: string, timestamp: number) {
    const keyLowerCase = key.toLowerCase();

    switch (this.state.kind) {
      case "idle":
        if (keyLowerCase === introKeyLowerCase) {
          this.state = {
            kind: "intro-key-received",
            expiryTime: timestamp + validityDuration,
          };
        }
        return null;
      case "intro-key-received": {
        if (timestamp >= this.state.expiryTime) {
          this.state = idleState;
          return null;
        } else {
          this.state = idleState;
          const mCls = this.classFromSecondKey.get(keyLowerCase);
          if (mCls == null) {
            return null;
          } else {
            return mCls;
          }
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
  focusBookmarkedChild(stem: GlobalFocusTargetStem) {
    const containerElt = GlobalFocusSteering.containerEltFromStem(stem);
    groupedFocusManager.focusBookmarkedChild(containerElt);
  }

  onKeyDown(key: string, timestamp: number) {
    const mStem = this.targetStem(key, timestamp);
    if (mStem == null) {
      // User typed something not triggering global focus steering.
      return;
    }

    this.focusBookmarkedChild(mStem);
  }
}

// TODO: Would it be more React-y to put this in a Context provided by a
// fairly high-up component in the tree for the IDE?
export let globalFocusSteering = (() => {
  let globalFocusSteering = new GlobalFocusSteering();

  globalFocusSteering.registerBinding("h", "gfs__help");
  globalFocusSteering.registerBinding("s", "gfs__actors");
  globalFocusSteering.registerBinding("c", "gfs__actorprops");

  return globalFocusSteering;
})();
