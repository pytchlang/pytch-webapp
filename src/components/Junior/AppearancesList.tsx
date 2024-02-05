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
import { useStoreActions, useStoreState } from "../../store";

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

  // Any costume of a sprite can be deleted, including if that would
  // mean the sprite is left with no costumes.  Also, if there is more
  // than one backdrop, then deletion is possible.  Deletion is only
  // *not* possible if this is the stage and it has exactly one
  // backdrop.
  const canBeDeleted = actorKind === "sprite" || appearances.length > 1;

  return (
    <>
      {appearances.map((a) => (
        <AssetCard
          key={a.name}
          assetKind="image"
          expectedPresentationKind="image"
          actorKind={actorKind}
          assetPresentation={a}
          fullPathname={a.name}
          canBeDeleted={canBeDeleted}
        />
      ))}
    </>
  );
};

export const AppearancesList = () => {
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const focusedActorId = useJrEditState((s) => s.focusedActor);

  // The following can throw; what happens?
  const focusedActor = useMappedProgram("<AppearancesList>", (program) =>
    StructuredProgramOps.uniqueActorById(program, focusedActorId)
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

  const showAddModal = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction.launchAdd
  );
  const assetNamePrefix = `${focusedActorId}/`;
  const operationContextKey = `${focusedActor.kind}/image` as const;
  const addFromDevice = () =>
    showAddModal({ operationContextKey, assetNamePrefix });

  const launchAddFromMediaLibraryAction = useStoreActions(
    (actions) => actions.userConfirmations.addClipArtItemsInteraction.launch
  );

  const addFromMediaLibrary = () =>
    launchAddFromMediaLibraryAction({ operationContextKey, assetNamePrefix });

  const classes = classNames(
    "Junior-AssetsList",
    "asset-kind-image",
    `actor-kind-${focusedActor.kind}`
  );

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${focusedActor.kind}-asset` as const;

  console.log("AppearancesList: adding with key");
  return (
    <div className="abs-0000-oflow">
      <div className={classes}>{content}</div>
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
