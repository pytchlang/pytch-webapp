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

type ViewCodeDiffArgs = { textA: string; textB: string };

export type ViewCodeDiff = {
  state: ViewCodeDiffState;
  setState: Action<ViewCodeDiff, ViewCodeDiffState>;
  launch: Thunk<ViewCodeDiff, ViewCodeDiffArgs>;
  dismiss: Thunk<ViewCodeDiff, void>;
};

export let viewCodeDiff: ViewCodeDiff = {
  state: { kind: "idle" },
  setState: propSetterAction("state"),

  dismiss: thunk((actions) => {
    actions.setState({ kind: "idle" });
  }),
};
