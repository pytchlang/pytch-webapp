import React, { useEffect } from "react";
import { useStoreActions } from "../../store";
import { stageWidth } from "../../constants";

const minStageWidth = (2 * stageWidth) / 3;

type WidthMonitorProps = {
  nonStageWd: number;
};
export const WidthMonitor: React.FC<WidthMonitorProps> = ({ nonStageWd }) => {
  const setStageDisplayWidth = useStoreActions(
    (actions) => actions.ideLayout.setStageDisplayWidth
  );

  const handleResize = () => {
    // TODO: Various places that use the displaySize state should
    // provide a custom equality function to avoid needless
    // re-rendering.
    //
    const stageWdToFill = window.innerWidth - nonStageWd;
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
