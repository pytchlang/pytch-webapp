import { Action, Thunk, thunk } from "easy-peasy";
import { propSetterAction } from "../../utils";

import { diffArrays } from "diff";

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
    const aLines = texts.textA.split("\n");
    const bLines = texts.textB.split("\n");
    const diffs = diffArrays(aLines, bLines);

    // Collapse adjacent del/add pairs into one "change" hunk.
    let hunks: Array<CodeDiffHunk> = [{ kind: "context", commonLines: [] }];
    for (const d of diffs) {
      const lastHunk = hunks[hunks.length - 1];
      if (d.added && lastHunk.kind === "del") {
        const changeHunk: CodeDiffHunk = {
          kind: "change",
          aLines: lastHunk.aLines,
          bLines: d.value,
        };
        hunks[hunks.length - 1] = changeHunk;
      } else {
        if (d.added) {
          hunks.push({ kind: "add", bLines: d.value });
        } else if (d.removed) {
          hunks.push({ kind: "del", aLines: d.value });
        } else {
          hunks.push({ kind: "context", commonLines: d.value });
        }
      }
    }

    hunks.shift();
    actions.setState({ kind: "active", hunks });
  }),

  dismiss: thunk((actions) => {
    actions.setState({ kind: "idle" });
  }),
};
