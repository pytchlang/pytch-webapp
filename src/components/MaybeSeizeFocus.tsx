import React, { useEffect } from "react";
import { useJrEditActions, useJrEditState } from "./Junior/hooks";

type MaybeSeizeFocusProps =
  | {
      targetRef: React.RefObject<HTMLElement | null>;
      doFocus?: never;
    }
  | {
      targetRef?: never;
      doFocus: () => void;
    };

export const MaybeSeizeFocus: React.FC<MaybeSeizeFocusProps> = ({
  targetRef,
  doFocus,
}) => {
  const focusReqSeq = useJrEditState((s) => s.activityContentFocusReqSeq);
  const focusDoneSeq = useJrEditState((s) => s.activityContentFocusDoneSeq);
  const markReqDone = useJrEditActions((a) => a.markActivityContentFocusDone);

  useEffect(() => {
    if (focusReqSeq > focusDoneSeq) {
      if (targetRef != null && targetRef.current != null) {
        targetRef.current.focus();
        markReqDone();
      }
      if (doFocus != null) {
        doFocus();
        markReqDone();
      }
    }
  });

  return false;
};
