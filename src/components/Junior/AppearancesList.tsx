import React from "react";
import { Lorem } from "./Lorem";
import {
  ActorKind,
  ActorKindOps,
} from "../../model/junior/structured-program";
import { AssetPresentation } from "../../model/asset";
import { AppearanceCard } from "./AppearanceCard";
import { NoContentHelp } from "./NoContentHelp";

type AppearancesContentProps = {
  actorKind: ActorKind;
  appearances: Array<AssetPresentation>;
};
const AppearancesContent: React.FC<AppearancesContentProps> = ({
  actorKind,
  appearances,
}) => {
  if (appearances.length === 0) {
    const appearanceName = ActorKindOps.names(actorKind).appearancesDisplay;
    return <NoContentHelp actorKind={actorKind} contentKind={appearanceName} />;
  }

  return (
    <>
      {appearances.map((a) => (
        <AppearanceCard
          key={a.id}
          actorKind={actorKind}
          assetPresentation={a}
          fullPathname={a.name}
        />
      ))}
    </>
  );
};

export const AppearancesList = () => {
  return (
    <div className="abs-0000-oflow">
      <div className="Junior-AppearancesList">
        <h2>AppearancesList</h2>
        <Lorem />
      </div>
    </div>
  );
};
