import { Action } from "easy-peasy";
import { IPytchAppModel, PytchAppModelActions } from "..";
import { ClipArtGalleryEntryId } from "../clipart-gallery-core";
import { ProjectId } from "../project-core";
import { addRemoteAssetToProject } from "../../database/indexed-db";
import { AssetOperationContext } from "../asset";
import {
  addAssetErrorSpecFromError,
  AddAssetSuccess,
  AddAssetsOutcomeNub,
  onAddAssetsCompleted,
} from "./add-assets";
import { FileProcessingFailure } from "./process-files";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  AttemptOutcome,
  runStateAction,
} from "./async-user-flow";
import { NavigationAbandonmentGuard } from "../../navigation-abandonment-guard";
import { assertNever } from "../../utils";
import { resolveMedialibUrl } from "../clipart-gallery";

type AddClipArtRunArgs = {
  projectId: ProjectId;
  operationContext: AssetOperationContext;
  assetNamePrefix: string;
  filterTag: string | null;
};

export type AddClipArtFilterState =
  | { kind: "always-all" }
  | { kind: "switchable"; tag: string; active: boolean };

export type AddClipArtRunState = {
  projectId: ProjectId;
  operationContext: AssetOperationContext;
  assetNamePrefix: string;
  filterState: AddClipArtFilterState;
  selectedIds: Array<ClipArtGalleryEntryId>;
};

type AddClipArtBase = AsyncUserFlowSlice<
  IPytchAppModel,
  AddClipArtRunArgs,
  AddClipArtRunState,
  AddAssetsOutcomeNub
>;

type SAction<ArgT> = Action<AddClipArtBase, ArgT>;

type AddClipArtActions = {
  selectItemById: SAction<ClipArtGalleryEntryId>;
  deselectItemById: SAction<ClipArtGalleryEntryId>;
  setFilterActive: SAction<boolean>;
};

export type AddClipArtFlow = AddClipArtBase & AddClipArtActions;

async function prepare(args: AddClipArtRunArgs): Promise<AddClipArtRunState> {
  // TODO: Preserve this from one run to the next?
  const filterState: AddClipArtFilterState = initialFilterStateFromFilterTag(
    args.filterTag
  );

  return {
    projectId: args.projectId,
    operationContext: args.operationContext,
    assetNamePrefix: args.assetNamePrefix,
    filterState,
    selectedIds: [],
  };
}

function isSubmittable(runState: AddClipArtRunState) {
  return runState.selectedIds.length > 0;
}

async function attempt(
  runState: AddClipArtRunState,
  actions: PytchAppModelActions,
  navGuard: NavigationAbandonmentGuard
): Promise<AttemptOutcome<AddAssetsOutcomeNub>> {
  let successes: Array<AddAssetSuccess> = [];
  let failures: Array<FileProcessingFailure> = [];

  const entries = actions.clipArtGallery.selectedEntries(runState.selectedIds);

  // Iterate over items of entries in one nested loop, so we can gather
  // the successes and failures without unduly complicated control flow
  // to handle navigation-abandoned (and other) exceptions.
  for (const entry of entries) {
    for (const item of entry.items) {
      const fullName = `${runState.assetNamePrefix}${item.name}`;
      try {
        const itemUrl = resolveMedialibUrl(item.relativeUrl);
        await navGuard.throwIfAbandoned(
          addRemoteAssetToProject(runState.projectId, itemUrl, fullName)
        );
        successes.push({ displayName: item.name });
      } catch (error) {
        if (navGuard.wasAbandoned(error)) {
          throw error;
        }

        const reason = addAssetErrorSpecFromError(
          runState.operationContext,
          item.name,
          error as Error
        );

        failures.push({ filename: item.name, reason });
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
    setFilterActive: runStateAction((state, filterActive) => {
      if (state.filterState.kind !== "switchable")
        throw new Error('state-kind must be "switchable"');
      state.filterState.active = filterActive;
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
  return asyncUserFlowSlice(specificSlice, {
    prepare,
    isSubmittable,
    attempt,
    onCompleted: onAddAssetsCompleted,
  });
})();

const kTagForShowAll = "__all__";
export function groupedFocusKeyFromFilterState(
  filterState: AddClipArtFilterState
): string {
  const tagLabel = (() => {
    switch (filterState.kind) {
      case "always-all":
        return kTagForShowAll;
      case "switchable":
        return filterState.active ? filterState.tag : kTagForShowAll;
      default:
        return assertNever(filterState);
    }
  })();
  return `MediaLibEntries-${tagLabel}`;
}

export function initialFilterStateFromFilterTag(
  filterTag: string | null
): AddClipArtFilterState {
  return filterTag == null
    ? { kind: "always-all" }
    : { kind: "switchable", tag: filterTag, active: true };
}
