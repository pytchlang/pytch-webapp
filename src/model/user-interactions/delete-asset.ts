import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  AssetOperationContext,
  assetOperationContextFromKey,
  AssetOperationContextKey,
} from "../asset";
import {
  AsyncUserFlowOptions,
  AsyncUserFlowSlice,
  alwaysSubmittable,
  asyncUserFlowSlice,
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
): Promise<void> {
  const deleteDescriptor = {
    operationContext: runState.operationContext,
    name: runState.name,
    displayName: runState.displayName,
  };
  await actions.activeProject.deleteAssetAndSync(deleteDescriptor);
}

export let deleteAssetFlow: DeleteAssetFlow = (() => {
  const flowOptions: AsyncUserFlowOptions = { pulseSuccessMessage: false };

  return asyncUserFlowSlice(
    {},
    prepare,
    alwaysSubmittable,
    attempt,
    flowOptions
  );
})();
