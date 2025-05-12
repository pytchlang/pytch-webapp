import React from "react";
import { useStoreState } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";

import { AddSomethingSingleButton } from "./AddSomethingButton";
import {
  ActorKind,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { AssetCard } from "./AssetCard";
import classNames from "classnames";
import { NoContentHelp } from "./NoContentHelp";
import { useRunFlow } from "../../model";
import { ListOfThings } from "../ListOfThings";
import { AssetPresentation } from "../../model/asset";

type SoundsContentProps = {
  actorKind: ActorKind;
  sounds: Array<AssetPresentation>;
};

const SoundsContent: React.FC<SoundsContentProps> = ({ actorKind, sounds }) => {
  if (sounds.length === 0) {
    return (
      <NoContentHelp
        actorKind={actorKind}
        contentKind="sounds"
        buttonsPlural={false}
      />
    );
  }

  return (
    <>
      {sounds.map((a, idx) => (
        <ListOfThings.Item key={a.name} className="Item-AssetCard" nonFocusable>
          <AssetCard
            dragDropAllowed={true}
            assetKind="audio"
            operationScope={actorKind}
            displayIndex={idx}
            assetPresentation={a}
            canBeDeleted={true}
            isGlobalSteerFocusTarget={idx === 0}
          />
        </ListOfThings.Item>
      ))}
    </>
  );
};

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

  const content = (() => {
    return <SoundsContent actorKind={actorKind} sounds={actorSounds} />;
  })();

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
    <div className="Junior-SoundsList">
      <ListOfThings.Container>
        <ol className={classes}>{content}</ol>
        <AddSomethingSingleButton
          key={addWhat}
          what={addWhat}
          label="Add from this device"
          onClick={addSound}
        />
      </ListOfThings.Container>
    </div>
  );
};
