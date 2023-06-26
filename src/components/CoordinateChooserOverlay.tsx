import React from "react";
import { createRef, useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { EmptyProps } from "../utils";

export const CoordinateChooserOverlay: React.FC<EmptyProps> = () => {
  const chooserState = useStoreState(
    (state) => state.ideLayout.coordsChooser.kind
  );

  if (chooserState === "idle") {
    return null;
  }

  return (
    <>
      <div className="CoordinateChooserSubOverlay abs-0000" />
    </>
  );
};
