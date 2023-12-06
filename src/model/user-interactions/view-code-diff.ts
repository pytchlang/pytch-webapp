import { Action, Thunk, thunk } from "easy-peasy";
import { propSetterAction } from "../../utils";
import { CodeDiffHunk, diffFromTexts } from "../code-diff";

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

  launch: thunk((actions, texts) => {
    const hunks = diffFromTexts(texts.textA, texts.textB);
    actions.setState({ kind: "active", hunks });
  }),

  dismiss: thunk((actions) => {
    actions.setState({ kind: "idle" });
  }),
};
