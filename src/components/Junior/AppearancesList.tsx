import React from "react";
import { useStoreState } from "../../store";
import {
  useActiveActorKind,
  useJrEditState,
  useReorderAssetFromEltFunc,
} from "./hooks";
import { AssetMetaDataOps } from "../../model/junior/structured-program";
import {
  AddSomethingButton,
  AddSomethingButtonStrip,
} from "./AddSomethingButton";
import { AssetsContent } from "./AssetsContent";
import { useRunFlow } from "../../model";
import { kFocusGroupFallbackClassName } from "../../model/junior/grouped-focus";
import { FocusGroupContainer } from "../FocusGroupContainer";
import { useMediaLibFilterTag } from "../hooks/tracked-tutorial";
import { useFocusContext } from "../hooks/focus-steering";
import {
  groupedFocusKeyFromFilterState,
  initialFilterStateFromFilterTag,
} from "../../model/user-interactions/clipart-gallery-select";
import { AssetOperationContext } from "../../model/asset";
import { useTranslation } from "react-i18next";
import { AssetSource } from "../../model/asset/core";

interface AppearancesListProps {
  showOnly?: boolean;
}

export const AppearancesList = ({ showOnly }: AppearancesListProps) => {
  const { t } = useTranslation("assets");
  const focusContext = useFocusContext("per-method");
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const activeActorId = useJrEditState((s) => s.activeActor);
  const activeActorKind = useActiveActorKind();
  const filterTag = useMediaLibFilterTag();

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);
  const runAddClipArt = useRunFlow((f) => f.addClipArtFlow);

  const tButtonLabel = (src: AssetSource) => t(`add-button.${src}`);

  const actorAppearances = AssetMetaDataOps.filterByActorMimeType(
    assets,
    activeActorId,
    "image"
  );

  const onReorder = useReorderAssetFromEltFunc(projectId, actorAppearances);

  // See comment in CodeEditor.
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  if (!showOnly && activeTab !== "appearances") {
    return false;
  }

  const assetNamePrefix = `${activeActorId}/`;
  const operationContext: AssetOperationContext = {
    scope: activeActorKind,
    assetKind: "image",
  };
  const addFromDevice = () =>
    runAddAssets({ projectId, operationContext, assetNamePrefix });

  const addFromMediaLibrary = () => {
    const initialFilterState = initialFilterStateFromFilterTag(filterTag);
    focusContext.setPendingGroupFocusKey(
      groupedFocusKeyFromFilterState(initialFilterState)
    );

    runAddClipArt({
      projectId,
      operationContext,
      assetNamePrefix,
      filterTag,
    });
  };

  // Also use this for "key", to make sure the colour switches instantly
  // rather than transitioning when moving from Stage to a Sprite.
  const addWhat = `${activeActorKind}-asset` as const;

  return (
    <FocusGroupContainer
      className="gfs__actorprops__container Junior-AppearancesList-container"
      groupedFocusKey={`ActorProperties/${activeActorId}/appearances`}
      opts={{ onReorder }}
    >
      <AssetsContent
        actorKind={activeActorKind}
        assetKind="image"
        assets={actorAppearances}
      />
      <AddSomethingButtonStrip>
        <AddSomethingButton
          key={`${addWhat}-lib`}
          className={kFocusGroupFallbackClassName}
          what={addWhat}
          label={tButtonLabel("media-library")}
          onClick={addFromMediaLibrary}
        />
        <AddSomethingButton
          key={`${addWhat}-dev`}
          what={addWhat}
          label={tButtonLabel("this-device")}
          onClick={addFromDevice}
        />
      </AddSomethingButtonStrip>
    </FocusGroupContainer>
  );
};
