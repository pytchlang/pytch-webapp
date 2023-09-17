import React from "react";
import { useStoreState, useStoreActions } from "../store";
import { AssetPresentation } from "../model/asset";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { failIfNull } from "../utils";
import { AssetThumbnail } from "./AssetThumbnail";

type AssetCardProps = {
  asset: AssetPresentation;
};
const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const projectId = useStoreState((state) => state.activeProject.project.id);

  const launchDeleteAction = useStoreActions(
    (actions) => actions.userConfirmations.launchDeleteAsset
  );

  const launchRename = useStoreActions(
    (actions) => actions.userConfirmations.renameAssetInteraction.launch
  );

  const launchCropScale = useStoreActions(
    (actions) => actions.userConfirmations.cropScaleImageInteraction.launch
  );

  const presentation = asset.presentation;
  const isImage = presentation.kind === "image";

  const onDelete = () =>
    launchDeleteAction({
      assetKindDisplayName: presentation.kind,
      assetName: asset.name,
      assetDisplayName: asset.name,
    });

  const onCopy = () => navigator.clipboard.writeText(`"${asset.name}"`);
  const onRename = () =>
    launchRename({ fixedPrefix: "", oldNameSuffix: asset.assetInProject.name });

  const onCropScale = () => {
    if (!isImage) {
      throw new Error(`asset "${asset.name}" is not of kind "image"`);
    }

    const existingCrop = asset.assetInProject.transform;
    const transformTargetType = existingCrop.targetType;
    if (transformTargetType !== "image")
      throw new Error(
        `existing transform for image "${asset.name}"` +
          ` targets kind "${transformTargetType}"`
      );

    const fullSourceImage = presentation.fullSourceImage;
    const originalSize = {
      width: fullSourceImage.width,
      height: fullSourceImage.height,
    };

    launchCropScale({
      projectId,
      assetName: asset.name,
      existingCrop,
      sourceURL: new URL(fullSourceImage.src),
      originalSize,
    });
  };

  const maybeCropDropdownItem = isImage && (
    <Dropdown.Item onClick={onCropScale}>
      <span className="with-icon">
        <span>Crop/scale</span>
        <FontAwesomeIcon icon="crop" />
      </span>
    </Dropdown.Item>
  );

  return (
    <Card className="AssetCard">
      <Card.Header>
        <code>{asset.name}</code>
        <DropdownButton align="end" title="⋮">
          <Dropdown.Item onClick={onCopy}>
            <span className="with-icon">
              <span>Copy name</span>
              <FontAwesomeIcon icon="copy" />
            </span>
          </Dropdown.Item>
          {maybeCropDropdownItem}
          <Dropdown.Item onClick={onRename}>Rename...</Dropdown.Item>
          <Dropdown.Item className="danger" onClick={onDelete}>
            DELETE
          </Dropdown.Item>
        </DropdownButton>
      </Card.Header>
      <Card.Body>
        <AssetThumbnail presentationData={presentation} />
      </Card.Body>
    </Card>
  );
};

const ProjectAssetList = () => {
  const loadState = useStoreState(
    (state) => state.activeProject.syncState.loadState
  );
  const maybeAssets = useStoreState(
    (state) => state.activeProject.project?.assets
  );
  const showUploadModal = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction.launch
  );

  const launchUploadModal = () => showUploadModal();

  const showClipArtModal = useStoreActions(
    (actions) => actions.userConfirmations.addClipArtItemsInteraction.launch
  );

  const launchClipArtModal = () => showClipArtModal({ assetNamePrefix: "" });

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

  const assets = failIfNull(
    maybeAssets,
    'no project even though loadState "succeeded"'
  );

  const intro =
    assets.length === 0 ? (
      <p className="info-pane-placeholder">
        Your project does not yet have any images or sounds. Use the button
        below to add some.
      </p>
    ) : (
      <h1>Your project’s images and sounds</h1>
    );

  return (
    <div className="AssetCardPane">
      {intro}
      <div className="AssetCardList">
        {assets.map((asset) => (
          <AssetCard key={asset.name} asset={asset} />
        ))}
      </div>
      <div className="buttons">
        <Button className="assets-button" onClick={launchUploadModal}>
          Add an image or sound
        </Button>
        or
        <Button className="assets-button" onClick={launchClipArtModal}>
          Choose from library
        </Button>
      </div>
    </div>
  );
};

export default ProjectAssetList;
