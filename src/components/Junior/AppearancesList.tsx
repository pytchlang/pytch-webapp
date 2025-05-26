import React from "react";
import { useStoreState } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";
import {
  AssetMetaDataOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import {
  AddSomethingButton,
  AddSomethingButtonStrip,
} from "./AddSomethingButton";
import { AssetsContent } from "./AssetsContent";
import { useRunFlow } from "../../model";

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

  const actorAppearances = AssetMetaDataOps.filterByActorMimeType(
    assets,
    focusedActorId,
    "image"
  );

  const assetNamePrefix = `${focusedActorId}/`;
  const operationContextKey = `${focusedActorKind}/image` as const;
  const addFromDevice = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix });

  const addFromMediaLibrary = () =>
    runAddClipArt({ projectId, operationContextKey, assetNamePrefix });

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${focusedActorKind}-asset` as const;

  return (
    <div>
      <AssetsContent
        actorKind={focusedActorKind}
        assetKind="image"
        assets={actorAppearances}
        buttonsPlural={true}
      />
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
