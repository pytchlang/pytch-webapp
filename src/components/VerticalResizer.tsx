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

};

export default VerticalResizer;
