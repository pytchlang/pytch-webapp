import { IPytchAppModel, PytchAppModelActions } from "../..";
import {
  AsyncUserFlowOptions,
  AsyncUserFlowSlice,
  VoidOutcome,
  alwaysSubmittable,
  asyncUserFlowSlice,
  idPrepare,
  noModalWithVoid,
} from "../../user-interactions/async-user-flow";
import { HandlerDeletionDescriptor } from "../structured-program/program";

type DeleteHandlerRunArgs = HandlerDeletionDescriptor;

type DeleteHandlerRunState = DeleteHandlerRunArgs;

// No actions:
export type DeleteHandlerFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  DeleteHandlerRunArgs,
  DeleteHandlerRunState
>;

async function attempt(
  runState: DeleteHandlerRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  // This action is sync.
  actions.activeProject.deleteHandler(runState);

  return noModalWithVoid;
}

export let deleteHandlerFlow: DeleteHandlerFlow = (() => {
  return asyncUserFlowSlice(
    {},
    { prepare: idPrepare, isSubmittable: alwaysSubmittable, attempt }
  );
})();
