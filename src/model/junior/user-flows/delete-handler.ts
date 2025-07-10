import { IPytchAppModel, PytchAppModelActions } from "../..";
import {
  AsyncUserFlowOptions,
  AsyncUserFlowSlice,
  alwaysSubmittable,
  asyncUserFlowSlice,
  idPrepare,
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
): Promise<void> {
  actions.activeProject.deleteHandler(runState);
}

export let deleteHandlerFlow: DeleteHandlerFlow = (() => {
  const flowOptions: AsyncUserFlowOptions = { pulseSuccessMessage: false };
  return asyncUserFlowSlice(
    {},
    idPrepare,
    alwaysSubmittable,
    attempt,
    flowOptions
  );
})();
