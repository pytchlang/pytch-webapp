type State =
  | { kind: "idle" }
  | { kind: "intro-key-received"; expiryTime: number };

const idleState: State = { kind: "idle" };

const validityDuration = 1.0;
const introKeyLowerCase = "g";

export type GlobalFocusTargetClass =
  | "gfs__activity-bar-or-content"
  | "gfs__actors"
  | "gfs__actor-properties";

export type MaybeGlobalFocusTargetClass = GlobalFocusTargetClass | undefined;

class GlobalFocusSteering {
  state: State;
  classFromSecondKey: Map<string, GlobalFocusTargetClass>;

  constructor() {
    this.state = idleState;
    this.classFromSecondKey = new Map();
  }

  registerBinding(secondKey: string, cls: GlobalFocusTargetClass) {
    this.classFromSecondKey.set(secondKey, cls);
  }

  onKeyDown(key: string, timestamp: number) {
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
      case "intro-key-received":
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

export let globalFocusSteering = (() => {
  let globalFocusSteering = new GlobalFocusSteering();

  globalFocusSteering.registerBinding("h", "gfs__activity-bar-or-content");
  globalFocusSteering.registerBinding("s", "gfs__actors");
  globalFocusSteering.registerBinding("c", "gfs__actor-properties");

  return globalFocusSteering;
})();
