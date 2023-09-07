import React from "react";
import {
  ActorKind,
  ActorKindOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { AssetPresentation } from "../../model/asset";
import { AppearanceCard } from "./AppearanceCard";
import { AddSomethingButton } from "./AddSomethingButton";

import { NoContentHelp } from "./NoContentHelp";
import { useJrEditActions, useJrEditState } from "./hooks";
import { useStoreState } from "../../store";
import { PytchProgramOps } from "../../model/pytch-program";

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
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const focusedActorId = useJrEditState((s) => s.focusedActor);

  // The following can throw; what happens?
  const focusedActor = useStoreState((state) =>
    StructuredProgramOps.uniqueActorById(
      PytchProgramOps.ensureKind(
        "<AppearancesList>",
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
        a.assetInProject.mimeType.startsWith("image/")
    );
    return (
      <AppearancesContent
        actorKind={focusedActor.kind}
        appearances={actorAssets}
      />
    );
  })();

  const launchAction = useJrEditActions((a) => a.addAssetsInteraction.launch);
  const addAppearance = () => launchAction();

  return (
    <div className="abs-0000-oflow">
      <div className="Junior-AppearancesList">{content}</div>
      <AddSomethingButton onClick={addAppearance} />
    </div>
  );
};
