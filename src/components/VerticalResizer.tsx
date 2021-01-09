import React from "react";
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
};

export default VerticalResizer;
