import { IPytchAppModel, PytchAppModelActions } from "..";
import { ProjectId } from "../project-core";
import {
  AsyncUserFlowSlice,
  alwaysSubmittable,
  asyncUserFlowSlice,
  idPrepare,
} from "./async-user-flow";

type DeleteProjectRunArgs = {
  id: ProjectId;
  name: string;
};

type DeleteProjectRunState = DeleteProjectRunArgs;

// No actions:
export type DeleteProjectFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  DeleteProjectRunArgs,
  DeleteProjectRunState
>;

async function attempt(
  runState: DeleteProjectRunState,
  actions: PytchAppModelActions
): Promise<void> {
  await actions.projectCollection.requestDeleteManyProjectsThenResync([
    runState.id,
  ]);
}

export let deleteProjectFlow: DeleteProjectFlow = (() => {
  return asyncUserFlowSlice({}, idPrepare, alwaysSubmittable, attempt);
})();
