import { CodeDiffHunk, diffFromTexts } from "../code-diff";
import {
  AsyncUserFlowSlice,
  alwaysSubmittable,
  asyncUserFlowSlice,
  emptyAttempt,
} from "./async-user-flow";
import { IPytchAppModel } from "..";

type ViewCodeDiffRunArgs = { textA: string; textB: string };

type ViewCodeDiffRunState = {
  hunks: Array<CodeDiffHunk>;
};

export type ViewCodeDiffFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  ViewCodeDiffRunArgs,
  ViewCodeDiffRunState
>;

async function prepare(
  args: ViewCodeDiffRunArgs
): Promise<ViewCodeDiffRunState> {
  const hunks = diffFromTexts(args.textA, args.textB);
  return { hunks };
}

export let viewCodeDiffFlow: ViewCodeDiffFlow = (() => {
  return asyncUserFlowSlice(
    {},
    { prepare, isSubmittable: alwaysSubmittable, attempt: emptyAttempt }
  );
})();
