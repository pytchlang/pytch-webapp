import {
  alwaysSubmittable,
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  emptyAttempt,
  idPrepare,
} from "./async-user-flow";
import { IPytchAppModel } from "..";

export interface DiffHelpSamples {
  unchanged: HTMLTableElement | null;
  deleted: HTMLTableElement | null;
  added: HTMLTableElement | null;
}

type CodeDiffHelpRunArgs = { samples: DiffHelpSamples };

type CodeDiffHelpRunState = CodeDiffHelpRunArgs;

type CodeDiffHelpBase = AsyncUserFlowSlice<
  IPytchAppModel,
  CodeDiffHelpRunArgs,
  CodeDiffHelpRunState
>;

type CodeDiffHelpActions = object;

export type CodeDiffHelpFlow = CodeDiffHelpBase & CodeDiffHelpActions;

export let codeDiffHelpFlow: CodeDiffHelpFlow = (() => {
  return asyncUserFlowSlice(
    {},
    {
      prepare: idPrepare,
      isSubmittable: alwaysSubmittable,
      attempt: emptyAttempt,
    }
  );
})();
