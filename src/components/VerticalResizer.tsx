import React, { useEffect } from "react";
import { stageHeight } from "../constants";
import { useStoreState, useStoreActions } from "../store";

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

  const onMouseDown = (event: any) => {
    const eventWithTouches = Object.assign({}, event, {
      touches: [{ clientX: event.clientX, clientY: event.clientY }],
    });
    onTouchStart(eventWithTouches);
  };

  const onTouchMove = (event: any) => {
    if (resizeState == null) return;

    const eventY = event.touches[0].clientY;
    const rawNewHeight =
      resizeState.dragStartHeight + eventY - resizeState.dragStartY;

    // Clamp to reasonable range.
    const newHeight = Math.min(
      Math.round(1.25 * stageHeight),
      Math.max(Math.round(0.5 * stageHeight), rawNewHeight)
    );

    setStageDisplayHeight(newHeight);
  };

  const onMouseMove = (event: any) => {
    const eventWithTouches = Object.assign({}, event, {
      touches: [{ clientX: event.clientX, clientY: event.clientY }],
    });
    onTouchMove(eventWithTouches);
  };

  const onMouseUp = (_event: any) => {
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
        onMouseUp(e);
      }}
    />
  );
};

export default VerticalResizer;
