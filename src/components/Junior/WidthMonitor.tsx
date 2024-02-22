import React, { useEffect } from "react";
import { EmptyProps } from "../../utils";
import { useStoreActions } from "../../store";
import { stageWidth } from "../../constants";

const minStageWidth = (2 * stageWidth) / 3;
export const WidthMonitor: React.FC<EmptyProps> = () => {
  const setStageDisplayWidth = useStoreActions(
    (actions) => actions.ideLayout.setStageDisplayWidth
  );

  const handleResize = () => {
    // TODO: This "1100" is a bit magic; it came from the min width of
    // the first two columns (512 each) then adding a bit.  Do something
    // more sensible for this.
    //
    // TODO: Various places that use the displaySize state should
    // provide a custom equality function to avoid needless
    // re-rendering.
    //
    const stageWdToFill = window.innerWidth - 1100;
    const targetWidth = Math.min(
      stageWidth,
      Math.max(minStageWidth, stageWdToFill)
    );
    setStageDisplayWidth(targetWidth);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  return null;
};
