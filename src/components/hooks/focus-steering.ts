import { createContext, MouseEventHandler } from "react";
import { GroupedFocusManager } from "../../model/junior/grouped-focus";
import { PytchProgramKind } from "../../model/pytch-program";

type FocusContextT = {
  focusBookmarkedItemOrQueue: GroupedFocusManager["focusBookmarkedItemOrQueueRequest"];

  groupContainerRefCallback: GroupedFocusManager["containerRefCallback"];
  onGroupItemClick: MouseEventHandler<HTMLElement>;
};

export const FocusContext = createContext<FocusContextT | null>(null);

export const createFocusContext = (
  _programKind: PytchProgramKind // Will use in due course
): FocusContextT => {
  const groupedFocusManager = new GroupedFocusManager();

  const focusBookmarkedItemOrQueue =
    groupedFocusManager.focusBookmarkedItemOrQueueRequest.bind(
      groupedFocusManager
    );

  const groupContainerRefCallback =
    groupedFocusManager.containerRefCallback.bind(groupedFocusManager);

  const onGroupItemClick = groupedFocusManager.onItemClick;

  return {
    focusBookmarkedItemOrQueue,

    groupContainerRefCallback,
    onGroupItemClick,
  };
};
