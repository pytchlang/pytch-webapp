import React from "react";
import { useStoreState } from "../store";
import { AssetOperationContext, AssetPresentation } from "../model/asset";
import { useRunFlow } from "../model";
import { NoContentHelp } from "./Junior/NoContentHelp";
import { SingleTab } from "./SingleTab";
import { AssetCard as JrAssetCard } from "./Junior/AssetCard";
import { AssetMetaDataOps } from "../model/junior/structured-program";
import {
  AddSomethingButton,
  AddSomethingButtonStrip,
} from "./Junior/AddSomethingButton";
import { FocusGroupContainer } from "./FocusGroupContainer";
import { kFocusGroupFallbackClassName } from "../model/junior/grouped-focus";
import { useMediaLibFilterTag } from "./hooks/media-lib-filter-tag";
import {
  groupedFocusKeyFromFilterState,
  initialFilterStateFromFilterTag,
} from "../model/user-interactions/clipart-gallery-select";
import { useFocusContext } from "./hooks/focus-steering";
import { useTranslation } from "react-i18next";

type AssetCardProps = {
  asset: AssetPresentation;
};
const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const assetKind = AssetMetaDataOps.mimeAssetKind(asset.mimeType);
  return (
    <JrAssetCard
      reorderingAllowed={false}
      operationScope="flat"
      assetKind={assetKind}
      assetPresentation={asset}
      canBeDeleted={true}
      displayIndex={null}
      nextPathname={undefined}
      prevPathname={undefined}
    />
  );
};

export const ProjectAssetList = () => {
  const { t } = useTranslation("ide");
  const { t: tAssets } = useTranslation("assets");

  const focusContext = useFocusContext("flat");
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const loadState = useStoreState(
    (state) => state.activeProject.syncState.loadState
  );
  const assets = useStoreState((state) => state.activeProject.project.assets);
  const filterTag = useMediaLibFilterTag();

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);
  const operationContext: AssetOperationContext = {
    scope: "flat",
    assetKind: "any",
  };
  const launchUploadModal = () =>
    runAddAssets({ projectId, operationContext, assetNamePrefix: "" });

  const runAddClipArt = useRunFlow((f) => f.addClipArtFlow);

  const launchClipArtModal = () => {
    const initialFilterState = initialFilterStateFromFilterTag(filterTag);
    focusContext.setPendingGroupFocusKey(
      groupedFocusKeyFromFilterState(initialFilterState)
    );

    runAddClipArt({
      projectId,
      operationContext,
      assetNamePrefix: "",
      filterTag,
    });
  };

  // Control flow in <IDE> component should only be rendering
  // <IDELayout> and hence us if load has succeeded.
  if (loadState !== "succeeded")
    throw new Error(
      'ProjectAssetList: expecting load-state "succeeded"' +
        ` but got "${loadState}"`
    );

  const maybeNoContentHelp = assets.length === 0 && (
    <NoContentHelp scopedResourceKind="flat.flat-asset" />
  );

  // TODO: Should we split this into two tabs: Images, Sounds?
  return (
    <div className="AssetCardPane-container compact-tablist-container">
      <SingleTab title={t("pane-title.flat.assets")}>
        <div className="abs-0000">
          <FocusGroupContainer
            className="AssetCardPane gfs__flatassets__container"
            groupedFocusKey="FlatAssetsList"
          >
            {maybeNoContentHelp}
            <ol className="AssetCardList">
              {assets.map((asset) => (
                <AssetCard key={asset.name} asset={asset} />
              ))}
            </ol>
            <AddSomethingButtonStrip>
              <AddSomethingButton
                key="flat-lib"
                className={kFocusGroupFallbackClassName}
                what="flat-asset"
                label={tAssets("add-button.media-library")}
                onClick={launchClipArtModal}
              />
              <AddSomethingButton
                key="flat-dev"
                what="flat-asset"
                label={tAssets("add-button.this-device")}
                onClick={launchUploadModal}
              />
            </AddSomethingButtonStrip>
          </FocusGroupContainer>
        </div>
      </SingleTab>
    </div>
  );
};
