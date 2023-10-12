import React from "react";
import { InfoPanel } from "./InfoPanel";
import { ActorProperties } from "./ActorProperties";
import { EmptyProps } from "../../utils";
import { useJrEditState } from "./hooks";
import classNames from "classnames";

export const EditorAndInfo: React.FC<EmptyProps> = () => {
  const infoPanelIsCollapsed = useJrEditState(
    (s) => s.infoPanelState === "collapsed"
  );

  const classes = classNames("Junior-EditorAndInfo", { infoPanelIsCollapsed });
  return (
    <div className={classes}>
      <ActorProperties />
      <InfoPanel />
    </div>
  );
};
