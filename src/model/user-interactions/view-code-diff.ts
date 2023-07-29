import { Action, Thunk, thunk } from "easy-peasy";
import { propSetterAction } from "../../utils";

export type CodeDiffHunk =
  | { kind: "context"; commonLines: Array<string> }
  | { kind: "change"; aLines: Array<string>; bLines: Array<string> }
  | { kind: "add"; bLines: Array<string> }
  | { kind: "del"; aLines: Array<string> };

type ViewCodeDiffState =
  | { kind: "idle" }
  | { kind: "active"; hunks: Array<CodeDiffHunk> };

export type ViewCodeDiff = {
  state: ViewCodeDiffState;
  setState: Action<ViewCodeDiff, ViewCodeDiffState>;
};

export let viewCodeDiff: ViewCodeDiff = {
  state: { kind: "idle" },
  setState: propSetterAction("state"),
};
