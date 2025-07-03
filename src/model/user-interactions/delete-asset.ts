import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  AssetOperationContext,
  assetOperationContextFromKey,
  AssetOperationContextKey,
} from "../asset";
import {
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
) {
  const deleteDescriptor = { name: runState.name };
  await actions.activeProject.deleteAssetAndSync(deleteDescriptor);
}

export let deleteAssetFlow: DeleteAssetFlow = (() => {
  return asyncUserFlowSlice({}, prepare, alwaysSubmittable, attempt);
})();
