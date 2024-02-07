import React from "react";
import { AssetPresentation } from "../../model/asset";
import { useStoreActions, useStoreState } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";

import { AddSomethingSingleButton } from "./AddSomethingButton";
import {
  ActorKind,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { AssetCard } from "./AssetCard";
import classNames from "classnames";
import { NoContentHelp } from "./NoContentHelp";

type SoundsContentProps = {
  actorKind: ActorKind;
  sounds: Array<AssetPresentation>;
};
const SoundsContent = ({ actorKind, sounds }: SoundsContentProps) => {
  if (sounds.length === 0)
    return <NoContentHelp actorKind={actorKind} contentKind="sounds" />;

  return (
    <>
      {sounds.map((a) => (
        <AssetCard
          key={a.name}
          assetKind="sound"
          expectedPresentationKind="sound"
          actorKind={actorKind}
          assetPresentation={a}
          fullPathname={a.name}
          canBeDeleted={true}
        />
      ))}
    </>
  );
};

export const SoundsList = () => {
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const focusedActorId = useJrEditState((s) => s.focusedActor);

  const focusedActor = useMappedProgram("<SoundsList>", (program) =>
    StructuredProgramOps.uniqueActorById(program, focusedActorId)
  );

  const content = (() => {
    // These startswith() calls feel a bit dodgy.
    const actorAssets = assets.filter(
      (a) =>
        a.name.startsWith(focusedActorId) &&
        a.assetInProject.mimeType.startsWith("audio/")
    );
    return <SoundsContent actorKind={focusedActor.kind} sounds={actorAssets} />;
  })();

  const showAddModal = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction.launchAdd
  );
  const assetNamePrefix = `${focusedActorId}/`;
  const operationContextKey = `${focusedActor.kind}/sound` as const;
  const addSound = () => showAddModal({ operationContextKey, assetNamePrefix });

  const classes = classNames(
    "Junior-AssetsList",
    "asset-kind-sound",
    `actor-kind-${focusedActor.kind}`
  );

  return (
    <div className="abs-0000-oflow">
      <div className={classes}>{content}</div>
      <AddSomethingSingleButton
        what={`${focusedActor.kind}-asset`}
        label="Add from this device"
        onClick={addSound}
      />
    </div>
  );
};
