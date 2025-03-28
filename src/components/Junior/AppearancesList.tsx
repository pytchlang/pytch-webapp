import React from "react";
import {
  ActorKind,
  ActorKindOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { AssetPresentation } from "../../model/asset";
import { AssetCard } from "./AssetCard";
import {
  AddSomethingButton,
  AddSomethingButtonStrip,
} from "./AddSomethingButton";
import classNames from "classnames";

import { NoContentHelp } from "./NoContentHelp";
import { useJrEditState, useMappedProgram } from "./hooks";
import { useStoreState } from "../../store";
import { useRunFlow } from "../../model";

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
    return (
      <NoContentHelp
        actorKind={actorKind}
        contentKind={appearanceName}
        buttonsPlural={true}
      />
    );
  }

  // Any costume of a sprite can be deleted, including if that would
  // mean the sprite is left with no costumes.  Also, if there is more
  // than one backdrop, then deletion is possible.  Deletion is only
  // *not* possible if this is the stage and it has exactly one
  // backdrop.
  const canBeDeleted = actorKind === "sprite" || appearances.length > 1;

  return (
    <>
      {appearances.map((a, idx) => (
        <AssetCard
          dragDropAllowed={true}
          key={a.name}
          assetKind="image"
          operationScope={actorKind}
          displayIndex={idx}
          assetPresentation={a}
          canBeDeleted={canBeDeleted}
        />
      ))}
    </>
  );
};

export const AppearancesList = () => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const focusedActorId = useJrEditState((s) => s.focusedActor);

  // The following can throw; what happens?
  const focusedActorKind = useMappedProgram(
    "<AppearancesList>",
    (program) =>
      StructuredProgramOps.uniqueActorById(program, focusedActorId).kind
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
        actorKind={focusedActorKind}
        appearances={actorAssets}
      />
    );
  })();

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);
  const assetNamePrefix = `${focusedActorId}/`;
  const operationContextKey = `${focusedActorKind}/image` as const;
  const addFromDevice = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix });

  const runAddClipArt = useRunFlow((f) => f.addClipArtFlow);
  const addFromMediaLibrary = () =>
    runAddClipArt({ projectId, operationContextKey, assetNamePrefix });

  const classes = classNames(
    "Junior-AssetsList",
    "asset-kind-image",
    `actor-kind-${focusedActorKind}`
  );

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${focusedActorKind}-asset` as const;

  return (
    <div className="Junior-AppearancesList">
      <ol className={classes}>{content}</ol>
      <AddSomethingButtonStrip>
        <AddSomethingButton
          key={`${addWhat}-lib`}
          what={addWhat}
          label="Add from media library"
          onClick={addFromMediaLibrary}
        />
        <AddSomethingButton
          key={`${addWhat}-dev`}
          what={addWhat}
          label="Add from this device"
          onClick={addFromDevice}
        />
      </AddSomethingButtonStrip>
    </div>
  );
};
