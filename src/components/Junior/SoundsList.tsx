import React from "react";
import { useStoreState } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";

import { AddSomethingSingleButton } from "./AddSomethingButton";
import { StructuredProgramOps } from "../../model/junior/structured-program";
import { AssetCard } from "./AssetCard";
import classNames from "classnames";
import { NoContentHelp } from "./NoContentHelp";
import { useRunFlow } from "../../model";

export const SoundsList = () => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const focusedActorId = useJrEditState((s) => s.focusedActor);

  const focusedActor = useMappedProgram("<SoundsList>", (program) =>
    StructuredProgramOps.uniqueActorById(program, focusedActorId)
  );

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);

  const actorKind = focusedActor.kind;

  // These startswith() calls feel a bit dodgy.
  const actorSounds = assets.filter(
    (asset) =>
      asset.name.startsWith(focusedActorId) &&
      asset.assetInProject.mimeType.startsWith("audio/")
  );

  const maybeNoContentHelp = actorSounds.length === 0 && (
    <NoContentHelp
      actorKind={actorKind}
      contentKind="sounds"
      buttonsPlural={false}
    />
  );

  const content = actorSounds.map((a, idx) => (
    <AssetCard
      dragDropAllowed={true}
      key={a.name}
      assetKind="audio"
      operationScope={actorKind}
      displayIndex={idx}
      assetPresentation={a}
      canBeDeleted={true}
    />
  ));

  const assetNamePrefix = `${focusedActorId}/`;
  const operationContextKey = `${focusedActor.kind}/audio` as const;
  const addSound = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix });

  const classes = classNames(
    "Junior-AssetsList",
    "asset-kind-sound",
    `actor-kind-${focusedActor.kind}`
  );

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${focusedActor.kind}-asset` as const;

  return (
    <div className="abs-0000-oflow">
      {maybeNoContentHelp}
      <ol className={classes}>{content}</ol>
      <AddSomethingSingleButton
        key={addWhat}
        what={addWhat}
        label="Add from this device"
        onClick={addSound}
      />
    </div>
  );
};
