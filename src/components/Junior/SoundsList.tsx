import React from "react";
import { useStoreState } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";

import { AddSomethingSingleButton } from "./AddSomethingButton";
import {
  AssetMetaDataOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { useRunFlow } from "../../model";
import { AssetsContent } from "./AssetsContent";

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

  const actorSounds = AssetMetaDataOps.filterByActorMimeType(
    assets,
    focusedActorId,
    "audio"
  );

  const assetNamePrefix = `${focusedActorId}/`;
  const operationContextKey = `${focusedActor.kind}/audio` as const;
  const addSound = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix });

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${focusedActor.kind}-asset` as const;

  return (
    <div>
      <AssetsContent
        actorKind={actorKind}
        assetKind="audio"
        assets={actorSounds}
        buttonsPlural={false}
      />
      <AddSomethingSingleButton
        key={addWhat}
        what={addWhat}
        label="Add from this device"
        onClick={addSound}
      />
    </div>
  );
};
