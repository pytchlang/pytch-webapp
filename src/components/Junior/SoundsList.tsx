import React from "react";
import { useStoreState } from "../../store";
import {
  useActiveActorKind,
  useJrEditState,
  useReorderAssetFromEltFunc,
} from "./hooks";

import { AddSomethingSingleButton } from "./AddSomethingButton";
import { AssetMetaDataOps } from "../../model/junior/structured-program";
import { useRunFlow } from "../../model";
import { AssetsContent } from "./AssetsContent";
import { kFocusGroupFallbackClassName } from "../../model/junior/grouped-focus";
import { FocusGroupContainer } from "../FocusGroupContainer";
import { AssetOperationContext } from "../../model/asset";
import { useTranslation } from "react-i18next";

interface SoundsListProps {
  showOnly?: boolean;
}

export const SoundsList = ({ showOnly }: SoundsListProps) => {
  const { t } = useTranslation("assets");
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const activeActorId = useJrEditState((s) => s.activeActor);
  const activeActorKind = useActiveActorKind();

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);

  const actorSounds = AssetMetaDataOps.filterByActorMimeType(
    assets,
    activeActorId,
    "audio"
  );

  const onReorder = useReorderAssetFromEltFunc(projectId, actorSounds);

  // See comment in CodeEditor.
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  if (!showOnly && activeTab !== "sounds") {
    return false;
  }

  const assetNamePrefix = `${activeActorId}/`;
  const operationContext: AssetOperationContext = {
    scope: activeActorKind,
    assetKind: "audio",
  };
  const addSound = () =>
    runAddAssets({ projectId, operationContext, assetNamePrefix });

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${activeActorKind}-asset` as const;

  return (
    <FocusGroupContainer
      className="gfs__actorprops__container Junior-SoundsList-container"
      groupedFocusKey={`ActorProperties/${activeActorId}/sounds`}
      opts={{ onReorder }}
    >
      <AssetsContent
        actorKind={activeActorKind}
        assetKind="audio"
        assets={actorSounds}
      />
      <AddSomethingSingleButton
        key={addWhat}
        buttonClassName={kFocusGroupFallbackClassName}
        what={addWhat}
        label={t("add-button.this-device")}
        onClick={addSound}
      />
    </FocusGroupContainer>
  );
};
