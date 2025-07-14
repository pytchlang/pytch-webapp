import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  AssetOperationContext,
  assetOperationContextFromKey,
  AssetOperationContextKey,
} from "../asset";
import {
  AsyncUserFlowSlice,
  VoidOutcome,
  alwaysSubmittable,
  asyncUserFlowSlice,
  noModalWithVoid,
} from "./async-user-flow";

type DeleteAssetRunArgs = {
  operationContextKey: AssetOperationContextKey;
  name: string;
  displayName: string;
};

type DeleteAssetRunState = {
  operationContext: AssetOperationContext;
} & Omit<DeleteAssetRunArgs, "operationContextKey">;

// No actions:
export type DeleteAssetFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  DeleteAssetRunArgs,
  DeleteAssetRunState
>;

async function prepare(args: DeleteAssetRunArgs): Promise<DeleteAssetRunState> {
  const operationContext = assetOperationContextFromKey(
    args.operationContextKey
  );
  return {
    operationContext,
    name: args.name,
    displayName: args.displayName,
  };
}

async function attempt(
  runState: DeleteAssetRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  const deleteDescriptor = {
    operationContext: runState.operationContext,
    name: runState.name,
    displayName: runState.displayName,
  };
  await actions.activeProject.deleteAssetAndSync(deleteDescriptor);

  return noModalWithVoid;
}

export let deleteAssetFlow: DeleteAssetFlow = (() => {
  return asyncUserFlowSlice(
    {},
    { prepare, isSubmittable: alwaysSubmittable, attempt }
  );
})();
