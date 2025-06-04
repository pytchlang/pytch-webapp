import { createContext, MouseEventHandler } from "react";
import {
  GlobalFocusSteering,
} from "../../model/junior/global-steer-focus";
import { GroupedFocusManager } from "../../model/junior/grouped-focus";
import { PytchProgramKind } from "../../model/pytch-program";

type FocusContextT = {
  focusBookmarkedItem: GlobalFocusSteering["focusBookmarkedItem"];
  focusBookmarkedItemOrQueue: GroupedFocusManager["focusBookmarkedItemOrQueueRequest"];

  groupContainerRefCallback: GroupedFocusManager["containerRefCallback"];
  onGroupItemClick: MouseEventHandler<HTMLElement>;

  onKeyDown: GlobalFocusSteering["onKeyDown"];
};

export const FocusContext = createContext<FocusContextT | null>(null);

export const createFocusContext = (
  _programKind: PytchProgramKind // Will use in due course
): FocusContextT => {
  const groupedFocusManager = new GroupedFocusManager();
  const globalFocusSteering = new GlobalFocusSteering(groupedFocusManager);

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
