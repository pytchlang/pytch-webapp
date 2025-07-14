import { Action } from "easy-peasy";
import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  ClipArtGalleryEntry,
  ClipArtGalleryEntryId,
} from "../clipart-gallery-core";
import { ProjectId } from "../project-core";
import { addRemoteAssetToProject } from "../../database/indexed-db";
import {
  AssetOperationContext,
  assetOperationContextFromKey,
  AssetOperationContextKey,
} from "../asset";
import {
  addAssetErrorMessageFromError,
  AddAssetSuccess,
  AddAssetFailure,
  AddAssetsOutcomeNub,
} from "./add-assets";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  AttemptOutcome,
  runStateAction,
  VoidOutcome,
} from "./async-user-flow";
import { NavigationAbandonmentGuard } from "../../navigation-abandonment-guard";

type AddClipArtRunArgs = {
  projectId: ProjectId;
  operationContextKey: AssetOperationContextKey;
  assetNamePrefix: string;
};

type AddClipArtRunState = {
  operationContext: AssetOperationContext;
  assetNamePrefix: string;
  projectId: ProjectId;
  selectedTags: Array<string>;
  selectedIds: Array<ClipArtGalleryEntryId>;
};

type AddClipArtBase = AsyncUserFlowSlice<
  IPytchAppModel,
  AddClipArtRunArgs,
  AddClipArtRunState,
  AddAssetsOutcomeNub
>;

type OnTagClickArgs = {
  tag: string;
  isMultiSelect: boolean;
};

export type OnTagClickFun = (args: OnTagClickArgs) => void;

type SAction<ArgT> = Action<AddClipArtBase, ArgT>;

type AddClipArtActions = {
  selectItemById: SAction<ClipArtGalleryEntryId>;
  deselectItemById: SAction<ClipArtGalleryEntryId>;
  onTagClick: SAction<OnTagClickArgs>;
};

export type AddClipArtFlow = AddClipArtBase & AddClipArtActions;

async function prepare(args: AddClipArtRunArgs): Promise<AddClipArtRunState> {
  const operationContext = assetOperationContextFromKey(
    args.operationContextKey
  );
  return {
    projectId: args.projectId,
    operationContext,
    assetNamePrefix: args.assetNamePrefix,
    selectedTags: [], // TODO: Can we preserve from one run to the next?
    selectedIds: [],
  };
}

function isSubmittable(runState: AddClipArtRunState) {
  return runState.selectedIds.length > 0;
}

const attemptAddOneEntry = async (
  projectId: ProjectId,
  assetNamePrefix: string,
  entry: ClipArtGalleryEntry,
  navGuard: NavigationAbandonmentGuard
) => {
  // Iterate with "for" --- rather than Promise.all() --- to make sure
  // the items are added to the project in the same order that they
  // appear in in the entry.
  for (const item of entry.items) {
    const fullName = `${assetNamePrefix}${item.name}`;
    await navGuard.throwIfAbandoned(
      addRemoteAssetToProject(projectId, item.url, fullName)
    );
  }
};

type AddItemFailure = {
  itemName: string;
  message: string;
};

async function attempt(
  runState: AddClipArtRunState,
  actions: PytchAppModelActions,
  navGuard: NavigationAbandonmentGuard
): Promise<AttemptOutcome<AddAssetsOutcomeNub>> {
  let successes: Array<AddAssetSuccess> = [];
  let failures: Array<AddAssetFailure> = [];

  const entries = actions.clipArtGallery.selectedEntries(runState.selectedIds);

  // Iterate over items of entries in one nested loop, so we can gather
  // the successes and failures without unduly complicated control flow
  // to handle navigation-abandoned (and other) exceptions.
  for (const entry of entries) {
    for (const item of entry.items) {
      const fullName = `${runState.assetNamePrefix}${item.name}`;
      try {
        await navGuard.throwIfAbandoned(
          addRemoteAssetToProject(runState.projectId, item.url, fullName)
        );
        successes.push({ displayName: item.name });
      } catch (error) {
        if (navGuard.wasAbandoned(error)) {
          throw error;
        }

        const reason = addAssetErrorMessageFromError(
          runState.operationContext,
          item.name,
          error as Error
        );

        failures.push({ displayName: item.name, reason });
      }
    }
  }

  await navGuard.throwIfAbandoned(
    actions.activeProject.syncAssetsFromStorage()
  );

  return {
    needsModalNotification: failures.length > 0,
    nub: { sourceKind: "media-library", successes, failures },
  };
}

export let addClipArtFlow: AddClipArtFlow = (() => {
  const specificSlice: AddClipArtActions = {
    onTagClick: runStateAction((state, { tag, isMultiSelect }) => {
      if (tag === "--all--") {
        state.selectedTags = [];
      } else {
        if (isMultiSelect) {
          const mExistingIndex = state.selectedTags.indexOf(tag);
          if (mExistingIndex === -1) {
            state.selectedTags.push(tag);
          } else {
            state.selectedTags.splice(mExistingIndex, 1);
          }
        } else {
          state.selectedTags = [tag];
        }
      }
    }),
    selectItemById: runStateAction((state, itemId) => {
      if (state.selectedIds.indexOf(itemId) === -1)
        state.selectedIds.push(itemId);
    }),
    deselectItemById: runStateAction((state, itemId) => {
      const index = state.selectedIds.indexOf(itemId);
      if (index !== -1) state.selectedIds.splice(index, 1);
    }),
  };
  return asyncUserFlowSlice(specificSlice, { prepare, isSubmittable, attempt });
})();
