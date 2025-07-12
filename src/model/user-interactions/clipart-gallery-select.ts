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
  let failures: Array<AddItemFailure> = [];

  const entries = actions.clipArtGallery.selectedEntries(runState.selectedIds);
  for (const entry of entries) {
    try {
      await attemptAddOneEntry(
        runState.projectId,
        runState.assetNamePrefix,
        entry,
        navGuard
      );
    } catch (err) {
      if (navGuard.wasAbandoned(err)) throw err;

      const message = addAssetErrorMessageFromError(
        runState.operationContext,
        entry.name,
        err as Error
      );

      // Possibly more context would be useful here, e.g., if the item
      // is within a group and the user didn't know they were trying to
      // add "digit9.png".  Revisit if problematic.
      failures.push({ itemName: entry.name, message });
    }
  }

  await navGuard.throwIfAbandoned(
    actions.activeProject.syncAssetsFromStorage()
  );

  return noModalWithVoid;
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
