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
): Promise<VoidOutcome> {
  await actions.projectCollection.requestDeleteManyProjectsThenResync(
    runState.ids
  );

  return noModalWithVoid;
}

function onCompleted(
  runState: DeleteManyProjectsRunState,
  _outcomeNub: void,
  storeActions: PytchAppModelActions
) {
  const nDeleted = runState.ids.length;

  // Don't think we should ever see nDeleted === 0, but check anyway.
  if (nDeleted > 0) {
    storeActions.activeProject.pulseNotableChange({
      kind: "projects-deleted",
      nDeleted,
    });
  }
}

export let deleteManyProjectsFlow: DeleteManyProjectsFlow = (() => {
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
