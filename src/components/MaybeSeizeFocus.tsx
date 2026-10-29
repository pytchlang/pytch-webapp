import React, { useEffect } from "react";
import { useJrEditActions, useJrEditState } from "./Junior/hooks";
import { FocusTarget } from "../model/junior/edit-state";

type MaybeSeizeFocusProps = { target: FocusTarget } & (
  | {
      targetRef: React.RefObject<HTMLElement | null>;
      doFocus?: never;
    }
  | {
      targetRef?: never;
      doFocus: () => void;
    }
);

/** If there is a pending request for focus to move to the given
 * `target`, focus the element given by `targetRef`, or call `doFocus`,
 * and clear the request.  See `pendingFocus` in `jrEditState`. */
export const MaybeSeizeFocus: React.FC<MaybeSeizeFocusProps> = ({
  target,
  targetRef,
  doFocus,
}) => {
  const pendingFocus = useJrEditState((s) => s.pendingFocus);
  const markReqDone = useJrEditActions((a) => a.markFocusRequestDone);

  useEffect(() => {
    if (pendingFocus?.target === target) {
      if (targetRef != null && targetRef.current != null) {
        targetRef.current.focus();
        markReqDone(target);
      }
      if (doFocus != null) {
        doFocus();
        markReqDone(target);
      }
    }
  });

  return false;
};
