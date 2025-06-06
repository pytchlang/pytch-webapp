import React from "react";
import { useStoreState } from "../../store";
import { useJrEditState, useMappedProgram } from "./hooks";

import { AddSomethingSingleButton } from "./AddSomethingButton";
import {
  AssetMetaDataOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { useRunFlow } from "../../model";
import { AssetsContent } from "./AssetsContent";
import {
  focusGroupContainerClass,
  kFocusGroupFallbackClassName,
} from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";

export const SoundsList = () => {
  const focusContext = useFocusContext("per-method");
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const activeActorId = useJrEditState((s) => s.activeActor);

  const activeActor = useMappedProgram("<SoundsList>", (program) =>
    StructuredProgramOps.uniqueActorById(program, activeActorId)
  );

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);

  // See comment in CodeEditor.
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  if (activeTab !== "sounds") {
    return false;
  }

  const actorKind = activeActor.kind;

  const actorSounds = AssetMetaDataOps.filterByActorMimeType(
    assets,
    activeActorId,
    "audio"
  );

  const assetNamePrefix = `${activeActorId}/`;
  const operationContextKey = `${activeActor.kind}/audio` as const;
  const addSound = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix });

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${activeActor.kind}-asset` as const;

  return (
    <div
      ref={focusContext.groupContainerRefCallback()}
      className={focusGroupContainerClass("gfs__actorprops__container")}
      data-grouped-focus-key={`ActorProperties/${activeActorId}/sounds`}
    >
      <AssetsContent
        actorKind={actorKind}
        assetKind="audio"
        assets={actorSounds}
        buttonsPlural={false}
      />
      <AddSomethingSingleButton
        key={addWhat}
        buttonClassName={kFocusGroupFallbackClassName}
        what={addWhat}
        label="Add from this device"
        onClick={addSound}
      />
    </div>
  );
};
