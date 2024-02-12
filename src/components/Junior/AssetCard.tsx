import React from "react";
import classNames from "classnames";
import {
  AssetPresentationDataKind,
  AssetPresentation,
} from "../../model/asset";
import {
  ActorKind,
  AssetMetaDataOps,
} from "../../model/junior/structured-program";
import { useStoreActions, useStoreState } from "../../store";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { AssetThumbnail } from "../AssetThumbnail";
import { useAssetCardDrag, useAssetCardDrop } from "./hooks";

import ImageAssetPreview from "../../images/drag-preview-image.png";
import SoundAssetPreview from "../../images/sound-wave-w96.png";
import { DragPreviewImage } from "react-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectId } from "../../model/project-core";

type RenameDropdownItemProps = {
  actorKind: ActorKind;
  assetKind: AssetPresentationDataKind;
  fullPathname: string;
};
const RenameDropdownItem: React.FC<RenameDropdownItemProps> = ({
  actorKind,
  assetKind,
  fullPathname,
}) => {
  const launchRenameAction = useStoreActions(
    (actions) => actions.userConfirmations.renameAssetInteraction.launch
  );

  const operationContextKey = `${actorKind}/${assetKind}` as const;
  const { actorId, basename } = AssetMetaDataOps.pathComponents(fullPathname);
  const launchRename = () =>
    launchRenameAction({
      operationContextKey,
      fixedPrefix: `${actorId}/`,
      oldNameSuffix: basename,
    });

  return <Dropdown.Item onClick={launchRename}>Rename</Dropdown.Item>;
};

type DeleteDropdownItemProps = {
  assetKind: AssetPresentationDataKind;
  fullPathname: string;
  displayName: string;
  isAllowed: boolean;
};
const DeleteDropdownItem: React.FC<DeleteDropdownItemProps> = ({
  assetKind,
  fullPathname,
  displayName,
  isAllowed,
}) => {
  const launchDeleteAction = useStoreActions(
    (actions) => actions.userConfirmations.launchDeleteAsset
  );

  const onDelete = async () => {
    if (!isAllowed) {
      console.warn(`forbidding attempt to delete "${fullPathname}"`);
      return;
    }

    // Slight hack: We're relying on the internal assetKind name to be
    // suitable for display use.
    launchDeleteAction({
      assetKindDisplayName: assetKind,
      assetName: fullPathname,
      assetDisplayName: displayName,
    });
  };

  return (
    <Dropdown.Item className="danger" onClick={onDelete} disabled={!isAllowed}>
      DELETE
    </Dropdown.Item>
  );
};

type CropScaleDropdownItemProps = {
  projectId: ProjectId;
  presentation: AssetPresentation;
};
const CropScaleDropdownItem: React.FC<CropScaleDropdownItemProps> = ({
  projectId,
  presentation,
}) => {
  const launchCropScale = useStoreActions(
    (actions) => actions.userConfirmations.cropScaleImageInteraction.launch
  );

  if (presentation.presentation.kind !== "image") {
    return;
  }

  const transform = presentation.assetInProject.transform;
  if (transform.targetType !== "image")
    throw new Error(
      `asset is "image" but transformation is "${transform.targetType}"`
    );

  const fullSource = presentation.presentation.fullSourceImage;

  const onClick = () => {
    launchCropScale({
      projectId,
      assetName: presentation.name,
      existingCrop: transform,
      originalSize: { width: fullSource.width, height: fullSource.height },
      sourceURL: new URL(fullSource.src),
    });
  };

  return (
    <Dropdown.Item onClick={onClick}>
      <span className="with-icon">
        <span>Crop/scale</span>
        <FontAwesomeIcon icon="crop" />
      </span>
    </Dropdown.Item>
  );
};

type AssetCardDropdownProps = {
  actorKind: ActorKind;
  presentation: AssetPresentation;
  deleteIsAllowed: boolean;
};
const AssetCardDropdown: React.FC<AssetCardDropdownProps> = ({
  actorKind,
  presentation,
  deleteIsAllowed,
}) => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const fullPathname = presentation.assetInProject.name;
  const basename = AssetMetaDataOps.basename(fullPathname);
  const assetKind = presentation.presentation.kind;

  return (
    <DropdownButton align="end" title="⋮">
      <CropScaleDropdownItem
        projectId={projectId}
        presentation={presentation}
      />
      <RenameDropdownItem
        actorKind={actorKind}
        assetKind={assetKind}
        fullPathname={fullPathname}
      />
      <DeleteDropdownItem
        assetKind={assetKind}
        fullPathname={fullPathname}
        displayName={basename}
        isAllowed={deleteIsAllowed}
      />
    </DropdownButton>
  );
};

type AssetCardProps = {
  assetKind: AssetPresentationDataKind;
  expectedPresentationKind: "image" | "sound";
  actorKind: ActorKind;
  assetPresentation: AssetPresentation;
  canBeDeleted: boolean;
};
export const AssetCard: React.FC<AssetCardProps> = ({
  assetKind,
  expectedPresentationKind,
  actorKind,
  assetPresentation,
  canBeDeleted,
}) => {
  const fullPathname = assetPresentation.name;

  const [dragProps, dragRef, preview] = useAssetCardDrag(fullPathname);
  const [dropProps, dropRef] = useAssetCardDrop(fullPathname);

  const presentation = assetPresentation.presentation;
  if (presentation.kind !== expectedPresentationKind) {
    throw new Error(
      `expecting asset "${fullPathname}" to` +
        ` have presentation of kind "${expectedPresentationKind}"` +
        ` but it is of kind "${presentation.kind}"`
    );
  }

  const classes = classNames(
    "AssetCard",
    `kind-${actorKind}`,
    dragProps,
    dropProps
  );
  const basename = AssetMetaDataOps.basename(fullPathname);

  const dragPreview =
    assetKind === "image" ? ImageAssetPreview : SoundAssetPreview;

  // TODO: Make the ActorCards accept a drop of an image too, adding
  // that image as asset to that actor.

  // Under live-reload development, the preview image only works the
  // first time you drag a particular asset.  It works correctly in a
  // static preview or release build.

  return (
    <>
      <DragPreviewImage connect={preview} src={dragPreview} />
      <div className={classes}>
        <div ref={dropRef}>
          <div ref={dragRef}>
            <div className="drag-masked-card">
              <div className="content">
                <div className="AssetCardContent">
                  <div className="thumbnail">
                    <AssetThumbnail presentationData={presentation} />
                  </div>
                  <div className="label">
                    <pre>{basename}</pre>
                  </div>
                </div>
                <AssetCardDropdown
                  actorKind={actorKind}
                  presentation={assetPresentation}
                  deleteIsAllowed={canBeDeleted}
                />
              </div>
              <div className="drag-mask" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
