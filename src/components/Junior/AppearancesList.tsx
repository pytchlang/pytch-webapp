import React from "react";
import { useStoreState } from "../../store";
import { useActiveActorKind, useJrEditState } from "./hooks";
import { AssetMetaDataOps } from "../../model/junior/structured-program";
import {
  AddSomethingButton,
  AddSomethingButtonStrip,
} from "./AddSomethingButton";
import { AssetsContent } from "./AssetsContent";
import { useRunFlow } from "../../model";
import { kFocusGroupFallbackClassName } from "../../model/junior/grouped-focus";
import { FocusGroupContainer } from "../FocusGroupContainer";

export const AppearancesList = () => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const activeActorId = useJrEditState((s) => s.activeActor);

  const activeActorKind = useActiveActorKind();

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);
  const runAddClipArt = useRunFlow((f) => f.addClipArtFlow);

  const actorAppearances = AssetMetaDataOps.filterByActorMimeType(
    assets,
    activeActorId,
    "image"
  );

  // See comment in CodeEditor.
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  if (activeTab !== "appearances") {
    return false;
  }

  const assetNamePrefix = `${activeActorId}/`;
  const operationContextKey = `${activeActorKind}/image` as const;
  const addFromDevice = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix });

  const addFromMediaLibrary = () =>
    runAddClipArt({ projectId, operationContextKey, assetNamePrefix });

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${activeActorKind}-asset` as const;

  return (
    <FocusGroupContainer
      className="gfs__actorprops__container Junior-AppearancesList-container"
      groupedFocusKey={`ActorProperties/${activeActorId}/appearances`}
    >
      <AssetsContent
        actorKind={activeActorKind}
        assetKind="image"
        assets={actorAppearances}
        buttonsPlural={true}
      />
      <AddSomethingButtonStrip>
        <AddSomethingButton
          key={`${addWhat}-lib`}
          className={kFocusGroupFallbackClassName}
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
    </FocusGroupContainer>
  );
};
