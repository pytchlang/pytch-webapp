import React from "react";
import { InfoPanel } from "./InfoPanel";
import { ActorProperties } from "./ActorProperties";
import { EmptyProps } from "../../utils";

export const EditorAndInfo: React.FC<EmptyProps> = () => {
  return (
    <div className="Junior-EditorAndInfo">
      <ActorProperties />
      <InfoPanel />
    </div>
  );
};
