import React from "react";
import { useStoreState } from "../store";
import { EmptyProps, assertNever } from "../utils";
import { StageWithControls } from "./StageWithControls";
import { ProjectAssetList } from "./ProjectAssetList";
import { ActorsList } from "./Junior/ActorsList";

export const ActorsOrAssets: React.FC<EmptyProps> = () => {
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );

  switch (programKind) {
    case "flat":
      return <ProjectAssetList />;
    case "per-method":
      return <ActorsList />;
    default:
      return assertNever(programKind);
  }
};

export const StageAndActorsOrAssets: React.FC<EmptyProps> = () => {
  return (
    <div className="StageAndActorsOrAssets">
      <StageWithControls />
      <ActorsOrAssets />
    </div>
  );
};
