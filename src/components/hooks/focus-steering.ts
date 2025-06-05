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

type BaseFocusContextT = {
  programKind: PytchProgramKind;
  focusBookmarkedItem: GlobalFocusSteering["focusBookmarkedItem"];
  focusBookmarkedItemOrQueue: GroupedFocusManager["focusBookmarkedItemOrQueueRequest"];

  groupContainerRefCallback: GroupedFocusManager["containerRefCallback"];
  onGroupItemClick: MouseEventHandler<HTMLElement>;

  onKeyDown: GlobalFocusSteering["onKeyDown"];

  onDisposeDeleteAsset: AsyncUserFlowOnDisposeFun;
};

type PerMethodExtraContext = {
  programKind: "per-method";
  onDisposeAddScript: () => AsyncUserFlowOnDisposeFun;
  onDisposeChangeHatBlock: AsyncUserFlowOnDisposeFun;
  onDisposeDeleteScript: AsyncUserFlowOnDisposeFun;
  onDisposeAddSprite: () => AsyncUserFlowOnDisposeFun;
  onDisposeDeleteOrRenameSprite: AsyncUserFlowOnDisposeFun;
};

type FlatExtraContext = {
  programKind: "flat";
  // Anything flat-IDE specific will go here.
};

type FocusContextT = BaseFocusContextT &
  (PerMethodExtraContext | FlatExtraContext);

export const FocusContext = createContext<FocusContextT | null>(null);

export const createFocusContext = (
  programKind: PytchProgramKind
): FocusContextT => {
  const groupedFocusManager = new GroupedFocusManager();
  const globalFocusSteering = new GlobalFocusSteering(
    programKind,
    groupedFocusManager
  );

  const focusBookmarkedItemOrQueue =
    groupedFocusManager.focusBookmarkedItemOrQueueRequest.bind(
      groupedFocusManager
    );

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

    groupContainerRefCallback,
    onGroupItemClick,

    onKeyDown,
  };

  switch (programKind) {
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
        programKind,
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
        programKind,
        onDisposeDeleteAsset,
      };

      return Object.assign({}, baseContextNub, flatExtras);
    }

    default:
      return assertNever(programKind);
  }
};

export function useFocusContext<KindT extends PytchProgramKind>(
  programKind: KindT
): FocusContextT & { programKind: KindT };
export function useFocusContext(): BaseFocusContextT;
export function useFocusContext<KindT extends PytchProgramKind>(
  programKind?: KindT
) {
  const ctx = useNonNullContext(FocusContext);

  if (programKind != null && ctx.programKind !== programKind)
    throw new Error(
      `expecting FocusContext for "${programKind}"` +
        ` but got "${ctx.programKind}"`
    );

  return ctx;
}
