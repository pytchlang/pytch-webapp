import { Action, Thunk, thunk } from "easy-peasy";
import { propSetterAction } from "../../utils";

export type CodeDiffHunk =
  | { kind: "context"; commonLines: Array<string> }
  | { kind: "change"; aLines: Array<string>; bLines: Array<string> }
  | { kind: "add"; bLines: Array<string> }
  | { kind: "del"; aLines: Array<string> };

export type ViewCodeDiff = {
};

export let viewCodeDiff: ViewCodeDiff = {
};
