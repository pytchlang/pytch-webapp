import { IPytchAppModel, PytchAppModelActions } from "../..";
import {
  AsyncUserFlowSlice,
  VoidOutcome,
  alwaysSubmittable,
  asyncUserFlowSlice,
  idPrepare,
  noModalWithVoid,
} from "../../user-interactions/async-user-flow";
import { Uuid } from "../structured-program";

type DeleteSpriteRunArgs = {
  actorId: Uuid;
  spriteDisplayName: string;
};

type DeleteSpriteRunState = DeleteSpriteRunArgs;

// No actions:
export type DeleteSpriteFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  DeleteSpriteRunArgs,
  DeleteSpriteRunState
>;

async function attempt(
  runState: DeleteSpriteRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  // This action is sync.
  actions.jrEditState.deleteActiveActor(runState.actorId);

  return noModalWithVoid;
}

export let deleteSpriteFlow: DeleteSpriteFlow = (() => {
  return asyncUserFlowSlice(
    {},
    { prepare: idPrepare, isSubmittable: alwaysSubmittable, attempt }
  );
})();
