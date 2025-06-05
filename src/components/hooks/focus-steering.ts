import { createContext, MouseEventHandler } from "react";
import {
  GlobalFocusSteering,
} from "../../model/junior/global-steer-focus";
import { GroupedFocusManager } from "../../model/junior/grouped-focus";
import { PytchProgramKind } from "../../model/pytch-program";
import { assertNever } from "../../utils";
import { useNonNullContext } from "./non-null-context";

type BaseFocusContextT = {
  programKind: PytchProgramKind;
  focusBookmarkedItem: GlobalFocusSteering["focusBookmarkedItem"];
  focusBookmarkedItemOrQueue: GroupedFocusManager["focusBookmarkedItemOrQueueRequest"];

  groupContainerRefCallback: GroupedFocusManager["containerRefCallback"];
  onGroupItemClick: MouseEventHandler<HTMLElement>;

  onKeyDown: GlobalFocusSteering["onKeyDown"];
};

type PerMethodExtraContext = {
  programKind: "per-method";
  // Anything per-method-IDE specific will go here.
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
      const perMethodExtras = {
        programKind,
      };

      return Object.assign({}, baseContextNub, perMethodExtras);
    }

    case "flat": {
      const flatExtras = {
        programKind,
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
