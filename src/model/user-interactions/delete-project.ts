import { IPytchAppModel, PytchAppModelActions } from "..";
import { ProjectId } from "../project-core";
import {
  AsyncUserFlowSlice,
  VoidOutcome,
  alwaysSubmittable,
  asyncUserFlowSlice,
  idPrepare,
  noModalWithVoid,
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
): Promise<VoidOutcome> {
  await actions.projectCollection.requestDeleteManyProjectsThenResync([
    runState.id,
  ]);

  return noModalWithVoid;
}

function onCompleted(
  _runState: DeleteProjectRunState,
  _outcomeNub: void,
  storeActions: PytchAppModelActions
) {
  storeActions.activeProject.pulseNotableChange({
    kind: "projects-deleted",
    nDeleted: 1,
  });
}

export let deleteProjectFlow: DeleteProjectFlow = (() => {
  return asyncUserFlowSlice(
    {},
    {
      prepare: idPrepare,
      isSubmittable: alwaysSubmittable,
      attempt,
      onCompleted,
    }
  );
})();
