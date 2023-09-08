import React from "react";
import { Lorem } from "./Lorem";
import { AssetPresentation } from "../../model/asset";
import {
  ActorKind,
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
  return (
    <div className="abs-0000-oflow">
      <div className="SoundsList">
        <h2>SoundsList</h2>
        <Lorem />
      </div>
    </div>
  );
};
