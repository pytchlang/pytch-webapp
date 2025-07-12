import { Action } from "easy-peasy";
import { simpleReadArrayBuffer } from "../../utils";
import { addAssetToProject } from "../../database/indexed-db";
import { FileProcessingFailure, FileFailureError } from "./process-files";
import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  AssetOperationContext,
  AssetOperationContextKey,
  assetOperationContextFromKey,
} from "../asset";
import {
  AsyncUserFlowSlice,
  asyncUserFlowSlice,
  noModalWithVoid,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";
import { ProjectId } from "../project-core";
import { NavigationAbandonmentGuard } from "../../navigation-abandonment-guard";

export function addAssetErrorMessageFromError(
  operationContext: AssetOperationContext,
  fileBasename: string,
  error: Error
) {
  if (error.name === "PytchDuplicateAssetNameError") {
    return (
      `Cannot add "${fileBasename}" to ${operationContext.scope}` +
      ` because it already contains ${operationContext.assetIndefinite}` +
      " of that name."
    );
  } else {
    return error.message;
  }
}

type AddAssetsRunArgs = {
  projectId: ProjectId;
  operationContextKey: AssetOperationContextKey;
  assetNamePrefix: string;
};

type AddAssetsRunState = {
  projectId: ProjectId;
  operationContext: AssetOperationContext;
  assetNamePrefix: string;
  chosenFiles: FileList | null;
};

type AddAssetsBase = AsyncUserFlowSlice<
  IPytchAppModel,
  AddAssetsRunArgs,
  AddAssetsRunState
>;

type SAction<ArgT> = Action<AddAssetsBase, ArgT>;

type AddAssetsActions = {
  setChosenFiles: SAction<FileList>;
};

export type AddAssetsFlow = AddAssetsBase & AddAssetsActions;

async function prepare(args: AddAssetsRunArgs): Promise<AddAssetsRunState> {
  const operationContext = assetOperationContextFromKey(
    args.operationContextKey
  );
  return {
    projectId: args.projectId,
    operationContext,
    assetNamePrefix: args.assetNamePrefix,
    chosenFiles: null,
  };
}

function isSubmittable(runState: AddAssetsRunState) {
  return runState.chosenFiles != null && runState.chosenFiles.length > 0;
}

async function attempt(
  runState: AddAssetsRunState,
  actions: PytchAppModelActions,
  navigationGuard: NavigationAbandonmentGuard
): Promise<VoidOutcome> {
  const { projectId, assetNamePrefix, operationContext } = runState;
  let failures: Array<FileProcessingFailure> = [];

  for (const file of runState.chosenFiles ?? []) {
    try {
      const fileBuffer = await simpleReadArrayBuffer(file);
      const assetPath = `${assetNamePrefix}${file.name}`;
      await navigationGuard.throwIfAbandoned(
        addAssetToProject(projectId, assetPath, file.type, fileBuffer)
      );
    } catch (error) {
      console.error("add-assets::attempt():", error);

      if (navigationGuard.wasAbandoned(error)) {
        throw error;
      }

      const reason = addAssetErrorMessageFromError(
        operationContext,
        file.name,
        error as Error
      );
      failures.push({ filename: file.name, reason });
    }
  }

  await navigationGuard.throwIfAbandoned(
    actions.activeProject.syncAssetsFromStorage()
  );

  if (failures.length > 0) {
    throw new FileFailureError(failures);
  }

  return noModalWithVoid;
}

export let addAssetsFlow: AddAssetsFlow = (() => {
  const specificSlice: AddAssetsActions = {
    setChosenFiles: setRunStateProp("chosenFiles"),
  };
  return asyncUserFlowSlice(specificSlice, prepare, isSubmittable, attempt);
})();
