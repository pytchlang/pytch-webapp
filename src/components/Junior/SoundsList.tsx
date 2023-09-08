import React from "react";
import { AssetPresentation } from "../../model/asset";
import { useStoreState } from "../../store";
import { useJrEditState } from "./hooks";
import {
  ActorKind,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { SoundCard } from "./SoundCard";
import { NoContentHelp } from "./NoContentHelp";
import { PytchProgramOps } from "../../model/pytch-program";

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

  // The following can throw; what happens?
  const focusedActor = useStoreState((state) =>
    StructuredProgramOps.uniqueActorById(
      PytchProgramOps.ensureKind(
        "<SoundsList>",
        state.activeProject.project.program,
        "per-method"
      ).program,
      focusedActorId
    )
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

  return (
    <div className="abs-0000-oflow">
      <div className="Junior-SoundsList">{content}</div>
    </div>
  );
};
