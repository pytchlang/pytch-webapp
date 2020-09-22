import React from "react";
import { useStoreState, useStoreActions } from "../store";
import { AssetPresentation } from "../model/asset";
import { SyncState } from "../model/project";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface AssetImageThumbnailProps {
  image: HTMLImageElement;
}

const AssetImageThumbnail: React.FC<AssetImageThumbnailProps> = ({ image }) => {
  const maybeConstrainWidth =
    image.width >= image.height && image.width > 120 ? "120px" : undefined;
  const maybeConstrainHeight =
    image.height > image.width && image.height > 120 ? "120px" : undefined;
  return (
    <div className="asset-preview">
      <img
        src={image.src}
        alt=""
        width={maybeConstrainWidth}
        height={maybeConstrainHeight}
      />
    </div>
  );
};

interface AssetCardProps {
  asset: AssetPresentation;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const requestConfirmation = useStoreActions(
    (actions) => actions.userConfirmations.requestDangerousActionConfirmation
  );

  const launchRename = useStoreActions(
    (actions) => actions.userConfirmations.launchRenameAsset
  );

  const thumbnail =
    asset.presentation.kind === "image" ? (
      <AssetImageThumbnail image={asset.presentation.image} />
    ) : (
      <div className="asset-preview">[TODO: Sound preview]</div>
    );

  const onDelete = async () => {
    requestConfirmation({
      kind: "delete-project-asset",
      assetKind: asset.presentation.kind, // TODO: Replace with enum
      assetName: asset.name,
      actionIfConfirmed: {
        typePath: "activeProject.deleteAssetAndSync",
        payload: asset.name,
      },
    });
  };

  const onCopy = () => {
    navigator.clipboard.writeText(`"${asset.name}"`);
  };

  const onRename = () => {
    launchRename(asset.assetInProject.name);
  };

  return (
    <Card className="AssetCard">
      <Card.Header>
        <code>{asset.name}</code>
        <DropdownButton alignRight title="⋮">
          <Dropdown.Item onClick={onCopy}>
            <span className="with-icon">
              <span>Copy name</span>
              <FontAwesomeIcon icon="copy" />
            </span>
          </Dropdown.Item>
          <Dropdown.Item onClick={onRename}>Rename...</Dropdown.Item>
          <Dropdown.Item className="danger" onClick={onDelete}>
            DELETE
          </Dropdown.Item>
        </DropdownButton>
      </Card.Header>
      <Card.Body>{thumbnail}</Card.Body>
    </Card>
  );
};

const ProjectAssetList = () => {
  const syncState = useStoreState((state) => state.activeProject.syncState);
  const assets = useStoreState((state) => state.activeProject.project?.assets);
  const showModal = useStoreActions(
    (actions) => actions.userConfirmations.addAssetInteraction.launch
  );

  const showAddModal = () => showModal();

  switch (syncState) {
    case SyncState.SyncNotStarted:
      return <div>Assets will load shortly....</div>;
    case SyncState.SyncingFromBackEnd:
      return <div>Assets loading....</div>;
    case SyncState.Error:
      return <div>Assets failed to load, oh no</div>;
    case SyncState.SyncingToBackEnd:
    case SyncState.Syncd:
      break; // Handle normal cases below.
  }

  if (assets == null) {
    throw Error("no project even though LoadingState succeeded");
  }

  const intro =
    assets.length === 0 ? (
      <p className="placeholder">
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
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
      <div className="buttons">
        <Button onClick={showAddModal}>Add an image or sound</Button>
      </div>
    </div>
  );
};

export default ProjectAssetList;
