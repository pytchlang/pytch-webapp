/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect } from "react";
import { stageHeight } from "../constants";
import { useStoreState, useStoreActions } from "../store";

const mouseFromTouch = (onTouch: any) => (event: any) => {
  const touches = [{ clientX: event.clientX, clientY: event.clientY }];
  const eventWithTouches = Object.assign({}, event, { touches });
  onTouch(eventWithTouches);
};

const minHeight = Math.round(0.5 * stageHeight);
const maxHeight = Math.round(1.25 * stageHeight);

// Thanks to
//
//     https://github.com/tomkp/react-split-pane
//
// for pointers and ideas.
//
const VerticalResizer = () => {
  const resizeState = useStoreState(
    (state) => state.ideLayout.stageVerticalResizeState
  );
  const {
    initiateVerticalResize,
    completeVerticalResize,
    setStageDisplayHeight,
  } = useStoreActions((actions) => actions.ideLayout);

  const onTouchStart = (event: any) =>
    initiateVerticalResize(event.touches[0].clientY);

  const onMouseDown = mouseFromTouch(onTouchStart);

  const onTouchMove = (event: any) => {
    if (resizeState == null) return;

    const eventY = event.touches[0].clientY;
    const rawNewHeight =
      resizeState.dragStartHeight + eventY - resizeState.dragStartY;

    // Clamp to reasonable range.
    const newHeight = Math.min(maxHeight, Math.max(minHeight, rawNewHeight));

    setStageDisplayHeight(newHeight);
  };

  const onMouseMove = mouseFromTouch(onTouchMove);

  const onMouseUp = () => {
    completeVerticalResize();
  };

  useEffect(() => {
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
    };
  });

  return (
    <div
      className="drag-resizer vertical"
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(e);
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        onTouchStart(e);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onMouseUp();
      }}
    />
  );
};

export default VerticalResizer;
