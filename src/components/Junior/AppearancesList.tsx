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
import { ListOfThings } from "../ListOfThings";
import { MaybeGlobalFocusTargetClass } from "../../model/junior/global-steer-focus";
import { AssetsContent } from "./AssetsContent";

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

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);
  const runAddClipArt = useRunFlow((f) => f.addClipArtFlow);

  // See comment in CodeEditor.
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  if (activeTab !== "appearances") {
    return false;
  }

  // These startswith() calls feel a bit dodgy.
  const actorAssets = assets.filter(
    (a) =>
      a.name.startsWith(focusedActorId) &&
      a.assetInProject.mimeType.startsWith("image/")
  );

  const assetNamePrefix = `${focusedActorId}/`;
  const operationContextKey = `${focusedActorKind}/image` as const;
  const addFromDevice = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix });

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

  const firstAddButtonClass: MaybeGlobalFocusTargetClass =
    actorAssets.length === 0 ? "gfs__actor-properties" : undefined;

  return (
    <div className="Junior-AppearancesList">
      <ListOfThings.Container>
        <ol className={classes}>
          <AssetsContent
            actorKind={focusedActorKind}
            assetKind="image"
            assets={actorAssets}
            buttonsPlural={true}
          />
        </ol>
        <AddSomethingButtonStrip>
          <AddSomethingButton
            key={`${addWhat}-lib`}
            className={firstAddButtonClass}
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
      </ListOfThings.Container>
    </div>
  );
};
