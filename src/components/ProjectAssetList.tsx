import React from "react";
import { useStoreState } from "../store";
import { AssetPresentation } from "../model/asset";
import { useRunFlow } from "../model";
import { NoContentHelp } from "./Junior/NoContentHelp";
import { SingleTab } from "./SingleTab";
import { AssetCard as JrAssetCard } from "./Junior/AssetCard";
import { AssetMetaDataOps } from "../model/junior/structured-program";
import {
  AddSomethingButton,
  AddSomethingButtonStrip,
} from "./Junior/AddSomethingButton";
import { focusGroupContainerClass } from "../model/junior/grouped-focus";
import { useFocusContext } from "./hooks/focus-steering";

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
  const focusContext = useFocusContext("flat");
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const loadState = useStoreState(
    (state) => state.activeProject.syncState.loadState
  );
  const assets = useStoreState((state) => state.activeProject.project.assets);

  const runAddAssets = useRunFlow((f) => f.addAssetsFlow);
  const operationContextKey = "flat/any" as const;
  const launchUploadModal = () =>
    runAddAssets({ projectId, operationContextKey, assetNamePrefix: "" });

  const runAddClipArt = useRunFlow((f) => f.addClipArtFlow);

  const launchClipArtModal = () =>
    runAddClipArt({ projectId, operationContextKey, assetNamePrefix: "" });

  switch (loadState) {
    case "pending":
      return <div>Assets loading....</div>;
    case "failed":
      // TODO: Handle more usefully
      return <div>Assets failed to load, oh no</div>;
    case "succeeded":
      break; // Handle normal case below.
    default:
      throw new Error(`unknown loadState "${loadState}"`);
  }

  const maybeNoContentHelp = assets.length === 0 && (
    <NoContentHelp
      actorKind="project"
      contentKind="images or sounds"
      buttonsPlural={true}
    />
  );

  const containerClassname = focusGroupContainerClass(
    "AssetCardPane gfs__flatassets__container"
  );

  // TODO: Should we split this into two tabs: Images, Sounds?
  return (
    <div className="AssetCardPane-container compact-tablist-container">
      <SingleTab title="Images and sounds">
        <div className="abs-0000">
          <div
            className={containerClassname}
            ref={focusContext.groupContainerRefCallback()}
            data-grouped-focus-key="FlatAssetsList"
          >
            {maybeNoContentHelp}
            <ol className="AssetCardList">
              {assets.map((asset) => (
                <AssetCard key={asset.name} asset={asset} />
              ))}
            </ol>
          </div>
          <AddSomethingButtonStrip>
            <AddSomethingButton
              key="flat-lib"
              what="flat-asset"
              label="Add from media library"
              onClick={launchClipArtModal}
            />
            <AddSomethingButton
              key="flat-dev"
              what="flat-asset"
              label="Add from this device"
              onClick={launchUploadModal}
            />
          </AddSomethingButtonStrip>
        </div>
      </SingleTab>
    </div>
  );
};
