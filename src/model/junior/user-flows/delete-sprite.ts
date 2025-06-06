import { IPytchAppModel, PytchAppModelActions } from "../..";
import {
  AsyncUserFlowSlice,
  alwaysSubmittable,
  asyncUserFlowSlice,
  idPrepare,
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
) {
  actions.jrEditState.deleteActiveActor(runState.actorId);
}

export let deleteSpriteFlow: DeleteSpriteFlow = (() => {
  return asyncUserFlowSlice({}, idPrepare, alwaysSubmittable, attempt);
})();
