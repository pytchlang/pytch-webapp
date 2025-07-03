import { createContext, MouseEventHandler } from "react";
import {
  GlobalFocusSteering,
  GlobalFocusTargetStem,
} from "../../model/junior/global-steer-focus";
import { GroupedFocusManager } from "../../model/junior/grouped-focus";
import { PytchProgramKind } from "../../model/pytch-program";
import {
  AsyncUserFlowOnDisposeFun,
  flowWasSettledByUser,
  RunOutcome,
} from "../../model/user-interactions/async-user-flow";
import { assertNever } from "../../utils";
import { useNonNullContext } from "./non-null-context";

export type FocusContextPageKind = PytchProgramKind | "my-projects-list";

type BaseFocusContextT = {
  pageKind: FocusContextPageKind;
  focusBookmarkedItem: GlobalFocusSteering["focusBookmarkedItem"];
  focusBookmarkedItemOrQueue: GroupedFocusManager["focusBookmarkedItemOrQueueRequest"];
  focusOffsetItem: GroupedFocusManager["focusOffsetItem"];
  bookmarkItemByKeyAndIndex: GroupedFocusManager["bookmarkItemByKeyAndIndex"];
  ensureBookmarkInRange: GroupedFocusManager["ensureBookmarkInRange"];
  setPendingGroupFocusKey: GroupedFocusManager["setPendingKey"];

  groupContainerRefCallback: GroupedFocusManager["containerRefCallback"];
  onGroupItemClick: MouseEventHandler<HTMLElement>;

  onKeyDown: GlobalFocusSteering["onKeyDown"];
};

type PerMethodExtraContext = {
  pageKind: "per-method";
  onDisposeAddScript: () => AsyncUserFlowOnDisposeFun;
  onDisposeChangeHatBlock: AsyncUserFlowOnDisposeFun;
  onDisposeDeleteScript: AsyncUserFlowOnDisposeFun;
  onDisposeAddSprite: () => AsyncUserFlowOnDisposeFun;
  onDisposeDeleteOrRenameSprite: AsyncUserFlowOnDisposeFun;
  onDisposeDeleteAsset: AsyncUserFlowOnDisposeFun;
};

type FlatExtraContext = {
  pageKind: "flat";
  onDisposeDeleteAsset: AsyncUserFlowOnDisposeFun;
};

type MyProjectsListExtraContext = {
  pageKind: "my-projects-list";
};

type FocusContextT = BaseFocusContextT &
  (PerMethodExtraContext | FlatExtraContext | MyProjectsListExtraContext);

export const FocusContext = createContext<FocusContextT | null>(null);

export const createFocusContext = (
  pageKind: FocusContextPageKind
): FocusContextT => {
  const groupedFocusManager = new GroupedFocusManager();
  const globalFocusSteering = new GlobalFocusSteering(
    pageKind,
    groupedFocusManager
  );

  const focusBookmarkedItemOrQueue =
    groupedFocusManager.focusBookmarkedItemOrQueueRequest.bind(
      groupedFocusManager
    );

  const focusOffsetItem =
    groupedFocusManager.focusOffsetItem.bind(groupedFocusManager);

  const bookmarkItemByKeyAndIndex =
    groupedFocusManager.bookmarkItemByKeyAndIndex.bind(groupedFocusManager);

  const ensureBookmarkInRange =
    groupedFocusManager.ensureBookmarkInRange.bind(groupedFocusManager);

  const setPendingGroupFocusKey =
    groupedFocusManager.setPendingKey.bind(groupedFocusManager);

  const focusBookmarkedItem =
    globalFocusSteering.focusBookmarkedItem.bind(globalFocusSteering);

  const focusBookmarkedIfUserSettledFun =
    (stem: GlobalFocusTargetStem) => (runOutcome: RunOutcome) => {
      if (flowWasSettledByUser(runOutcome)) {
        globalFocusSteering.focusBookmarkedItem(stem);
      }
    };

  const bookmarkFirstNewItemIfSubmittedFun =
    (stem: GlobalFocusTargetStem) => () => {
      const initialNItems = GlobalFocusSteering.nItemsInGroup(stem);
      return (runOutcome: RunOutcome) => {
        switch (runOutcome) {
          case "succeeded":
            globalFocusSteering.focusAbsoluteItem(stem, initialNItems);
            break;
          case "cancelled-by-user":
            globalFocusSteering.focusBookmarkedItem(stem);
            break;
          case "abandoned-by-navigation":
          case "error":
            break;
          default:
            assertNever(runOutcome);
        }
      };
    };

  const groupContainerRefCallback =
    groupedFocusManager.containerRefCallback.bind(groupedFocusManager);

  const onGroupItemClick = groupedFocusManager.onItemClick;

  const onKeyDown = globalFocusSteering.onKeyDown.bind(globalFocusSteering);

  const baseContextNub = {
    focusBookmarkedItem,
    focusBookmarkedItemOrQueue,
    focusOffsetItem,
    bookmarkItemByKeyAndIndex,
    ensureBookmarkInRange,

    setPendingGroupFocusKey,
    groupContainerRefCallback,
    onGroupItemClick,

    onKeyDown,
  };

  switch (pageKind) {
    case "per-method": {
      const focusBookmarkedActor =
        focusBookmarkedIfUserSettledFun("gfs__actors");
      const focusBookmarkedActorProp =
        focusBookmarkedIfUserSettledFun("gfs__actorprops");

      const onDisposeAddScript =
        bookmarkFirstNewItemIfSubmittedFun("gfs__actorprops");
      const onDisposeAddSprite =
        bookmarkFirstNewItemIfSubmittedFun("gfs__actors");

      const perMethodExtras = {
        pageKind,
        onDisposeDeleteAsset: focusBookmarkedActorProp,
        onDisposeAddScript,
        onDisposeChangeHatBlock: focusBookmarkedActorProp,
        onDisposeDeleteScript: focusBookmarkedActorProp,
        onDisposeAddSprite,
        onDisposeDeleteOrRenameSprite: focusBookmarkedActor,
      };

      return Object.assign({}, baseContextNub, perMethodExtras);
    }

    case "flat": {
      const onDisposeDeleteAsset =
        focusBookmarkedIfUserSettledFun("gfs__flatassets");

      const flatExtras = {
        pageKind,
        onDisposeDeleteAsset,
      };

      return Object.assign({}, baseContextNub, flatExtras);
    }

    case "my-projects-list": {
      const myProjectListExtras = {
        pageKind,
      };
      return Object.assign({}, baseContextNub, myProjectListExtras);
    }

    default:
      return assertNever(pageKind);
  }
};

export function useFocusContext<KindT extends FocusContextPageKind>(
  pageKind: KindT
): FocusContextT & { pageKind: KindT };
export function useFocusContext(): BaseFocusContextT;
export function useFocusContext<KindT extends FocusContextPageKind>(
  pageKind?: KindT
) {
  const ctx = useNonNullContext(FocusContext);

  if (pageKind != null && ctx.pageKind !== pageKind)
    throw new Error(
      `expecting FocusContext for "${pageKind}" but got "${ctx.pageKind}"`
    );

  return ctx;
}
