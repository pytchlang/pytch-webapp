import { IPytchAppModel, PytchAppModelActions } from "../..";
import {
  AsyncUserFlowSlice,
  AttemptOutcome,
  alwaysSubmittable,
  asyncUserFlowSlice,
  idPrepare,
} from "../../user-interactions/async-user-flow";
import { HandlerInActorContext } from "../structured-program";
import { HandlerDeletionDescriptor } from "../structured-program/program";

type DeleteHandlerRunArgs = HandlerDeletionDescriptor;

type DeleteHandlerRunState = DeleteHandlerRunArgs;

type DeleteHandlerOutcomeNub = {
  handler: HandlerInActorContext;
};

type DeleteHandlerOutcome = AttemptOutcome<DeleteHandlerOutcomeNub>;

// No actions:
export type DeleteHandlerFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  DeleteHandlerRunArgs,
  DeleteHandlerRunState,
  DeleteHandlerOutcomeNub
>;

async function attempt(
  runState: DeleteHandlerRunState,
  actions: PytchAppModelActions
): Promise<DeleteHandlerOutcome> {
  // This action is sync.
  const handler = actions.activeProject.deleteHandler(runState);

  return { needsModalNotification: false, nub: { handler } };
}

export let deleteHandlerFlow: DeleteHandlerFlow = (() => {
  return asyncUserFlowSlice(
    {},
    { prepare: idPrepare, isSubmittable: alwaysSubmittable, attempt }
  );
})();
