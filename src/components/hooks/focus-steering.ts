import { createContext, MouseEventHandler } from "react";
import {
  GlobalFocusSteering,
} from "../../model/junior/global-steer-focus";
import { GroupedFocusManager } from "../../model/junior/grouped-focus";
import { PytchProgramKind } from "../../model/pytch-program";

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

  return {
    focusBookmarkedItem,
    focusBookmarkedItemOrQueue,

    groupContainerRefCallback,
    onGroupItemClick,

    onKeyDown,
  };
};
