import React from "react";
import { AssetPresentation } from "../../model/asset";
import { useStoreState } from "../../store";
import { useJrEditActions, useJrEditState, useMappedProgram } from "./hooks";

import { AddSomethingButton } from "./AddSomethingButton";
import {
  ActorKind,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { SoundCard } from "./SoundCard";
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
        <SoundCard
          key={a.id}
          actorKind={actorKind}
          assetPresentation={a}
          fullPathname={a.name}
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

  const showAddModal = useJrEditActions((a) => a.addAssetsInteraction.launch);
  const addSound = () => showAddModal();

  return (
    <div className="abs-0000-oflow">
      <div className="Junior-SoundsList">{content}</div>
      <AddSomethingButton onClick={addSound} />
    </div>
  );
};
