import React from "react";
import { useStoreState } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";
import { AddSomethingSingleButton } from "./AddSomethingButton";
import { StructuredProgramOps } from "../../model/junior/structured-program";
import { useRunFlow } from "../../model";
import { ListOfThings } from "../ListOfThings";
import { AssetsContent } from "./AssetsContent";
import {
  containerRefCallback,
  focusGroupContainerClass,
  kFocusGroupFallbackClassname,
} from "../../model/junior/grouped-focus";

export const SoundsList = () => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const focusedActorId = useJrEditState((s) => s.focusedActor);

  const focusedActor = useMappedProgram("<SoundsList>", (program) =>
    StructuredProgramOps.uniqueActorById(program, focusedActorId)
  );

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);

  // See comment in CodeEditor.
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  if (activeTab !== "sounds") {
    return false;
  }

  const actorKind = focusedActor.kind;

  // These startswith() calls feel a bit dodgy.
  const actorSounds = assets.filter(
    (asset) =>
      asset.name.startsWith(focusedActorId) &&
      asset.assetInProject.mimeType.startsWith("audio/")
  );

  const assetNamePrefix = `${focusedActorId}/`;
  const operationContextKey = `${focusedActor.kind}/audio` as const;
  const addSound = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix });

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${focusedActor.kind}-asset` as const;

  return (
    <div className="Junior-SoundsList">
      <div
        ref={containerRefCallback()}
        className={focusGroupContainerClass("gfs__actorprops__container")}
        data-grouped-focus-key={`ActorProperties/${focusedActorId}/sounds`}
      >
        <AssetsContent
          actorKind={actorKind}
          assetKind="audio"
          assets={actorSounds}
          buttonsPlural={false}
        />
        <AddSomethingSingleButton
          key={addWhat}
          buttonClassName={kFocusGroupFallbackClassname}
          what={addWhat}
          label="Add from this device"
          onClick={addSound}
        />
      </div>
    </div>
  );
};
