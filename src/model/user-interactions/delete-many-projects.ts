import { IPytchAppModel, PytchAppModelActions } from "..";
import { ProjectId } from "../project-core";
import {
  AsyncUserFlowSlice,
  alwaysSubmittable,
  asyncUserFlowSlice,
  idPrepare,
} from "./async-user-flow";

type DeleteManyProjectsRunArgs = {
  ids: Array<ProjectId>;
};

type DeleteManyProjectsRunState = DeleteManyProjectsRunArgs;

// No actions:
export type DeleteManyProjectsFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  DeleteManyProjectsRunArgs,
  DeleteManyProjectsRunState
>;

async function attempt(
  runState: DeleteManyProjectsRunState,
  actions: PytchAppModelActions
): Promise<void> {
  await actions.projectCollection.requestDeleteManyProjectsThenResync(
    runState.ids
  );
}

export let deleteManyProjectsFlow: DeleteManyProjectsFlow = (() => {
  return asyncUserFlowSlice({}, idPrepare, alwaysSubmittable, attempt);
})();
