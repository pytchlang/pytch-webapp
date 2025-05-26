import React from "react";
import classNames from "classnames";
import { AssetPresentation } from "../../model/asset";
import { PytchProgramOps } from "../../model/pytch-program";
import { useStoreState } from "../../store";
import { AssetThumbnail } from "../AssetThumbnail";
import { useAssetCardDrag, useAssetCardDrop } from "./hooks";

import ImageAssetPreview from "../../images/drag-preview-image.png";
import SoundAssetPreview from "../../images/sound-wave-w96.png";
import { DragPreviewImage } from "react-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectId } from "../../model/project-core";
import { useRunFlow } from "../../model";
import { AssetMimeType } from "../../model/junior/structured-program/asset";
import { AssetOperationScope } from "../../model/asset/core";
import { copyTextToClipboard } from "../../utils";
import { pyStringRepr } from "../../skulpt-connection/utils";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import {
  groupedFocusManager,
  kFocusGroupItemClassName,
} from "../../model/junior/grouped-focus";

type RenameDropdownItemProps = {
  operationScope: AssetOperationScope;
  assetKind: AssetMimeType;
  fullPathname: string;
};
const RenameDropdownItem: React.FC<RenameDropdownItemProps> = ({
  operationScope,
  assetKind,
  fullPathname,
}) => {
  const runRenameAsset = useRunFlow((f) => f.renameAssetFlow);

  const operationContextKey = `${operationScope}/${assetKind}` as const;
  const nameAffixes = PytchProgramOps.assetPathAffixes(fullPathname);
  const launchRename = () =>
    runRenameAsset({
      operationContextKey,
      fixedPrefix: nameAffixes.prefix,
      oldNameSuffix: nameAffixes.suffix,
    });

  return (
    <CaptiveContextMenu.DropdownItem onInvoke={launchRename}>
      Rename
    </CaptiveContextMenu.DropdownItem>
  );
};

type DeleteDropdownItemProps = {
  assetKind: AssetMimeType;
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
  const runDeleteAsset = useRunFlow((f) => f.deleteAssetFlow);

  const onDelete = () => {
    if (!isAllowed) {
      console.warn(`forbidding attempt to delete "${fullPathname}"`);
      return;
    }

    // Slight hack: We're relying on the internal assetKind name to be
    // suitable for display use.
    runDeleteAsset({
      kindDisplayName: assetKind,
      name: fullPathname,
      displayName,
    });
  };

  return (
    <CaptiveContextMenu.DropdownItem
      className="danger"
      onInvoke={onDelete}
      disabled={!isAllowed}
    >
      DELETE
    </CaptiveContextMenu.DropdownItem>
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
  const runCropScaleImage = useRunFlow((f) => f.cropScaleImageFlow);

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
    runCropScaleImage({
      projectId,
      assetName: presentation.name,
      existingCrop: transform,
      originalSize: { width: fullSource.width, height: fullSource.height },
      sourceURL: new URL(fullSource.src),
    });
  };

  return (
    <CaptiveContextMenu.DropdownItem onInvoke={onClick}>
      <span className="with-icon">
        <span>Crop/scale</span>
        <FontAwesomeIcon icon="crop" />
      </span>
    </CaptiveContextMenu.DropdownItem>
  );
};

type CopyAssetNameDropdownItemProps = { assetName: string };
const CopyAssetNameDropdownItem: React.FC<CopyAssetNameDropdownItemProps> = ({
  assetName,
}) => {
  const nameStringLiteral = pyStringRepr(assetName);
  const onCopyName = () => copyTextToClipboard(nameStringLiteral);
  return (
    <CaptiveContextMenu.DropdownItem onInvoke={onCopyName}>
      <span className="with-icon">
        <span>Copy name</span>
        <FontAwesomeIcon icon="copy" />
      </span>
    </CaptiveContextMenu.DropdownItem>
  );
};

type AssetCardDropdownProps = {
  operationScope: AssetOperationScope;
  presentation: AssetPresentation;
  deleteIsAllowed: boolean;
};
const AssetCardDropdown: React.FC<AssetCardDropdownProps> = ({
  operationScope,
  presentation,
  deleteIsAllowed,
}) => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const fullPathname = presentation.assetInProject.name;
  const displayName = PytchProgramOps.assetPathAffixes(fullPathname).suffix;
  const assetKind = presentation.presentation.kind;

  return (
    <CaptiveContextMenu.DropdownMenu>
      <CopyAssetNameDropdownItem assetName={displayName} />
      <CropScaleDropdownItem
        projectId={projectId}
        presentation={presentation}
      />
      <RenameDropdownItem
        operationScope={operationScope}
        assetKind={assetKind}
        fullPathname={fullPathname}
      />
      <DeleteDropdownItem
        assetKind={assetKind}
        fullPathname={fullPathname}
        displayName={displayName}
        isAllowed={deleteIsAllowed}
      />
    </CaptiveContextMenu.DropdownMenu>
  );
};

type AssetCardProps = {
  dragDropAllowed: boolean;
  assetKind: AssetMimeType;
  operationScope: AssetOperationScope;
  displayIndex: number | null;
  assetPresentation: AssetPresentation;
  canBeDeleted: boolean;
};
export const AssetCard: React.FC<AssetCardProps> = ({
  dragDropAllowed,
  assetKind,
  operationScope,
  displayIndex,
  assetPresentation,
  canBeDeleted,
}) => {
  const fullPathname = assetPresentation.name;

  const [dragProps, dragRef, preview] = useAssetCardDrag(
    fullPathname,
    dragDropAllowed
  );
  const [dropProps, dropRef] = useAssetCardDrop(fullPathname, dragDropAllowed);

  const presentation = assetPresentation.presentation;
  if (presentation.kind !== assetKind) {
    throw new Error(
      `expecting asset "${fullPathname}" to` +
        ` have presentation of kind "${assetKind}"` +
        ` but it is of kind "${presentation.kind}"`
    );
  }

  const classes = classNames(
    "AssetCard",
    `kind-${operationScope}`,
    dragProps,
    dropProps
  );
  const label = PytchProgramOps.assetPathAffixes(fullPathname).suffix;

  const dragPreview =
    assetKind === "image" ? ImageAssetPreview : SoundAssetPreview;

  // TODO: Make the ActorCards accept a drop of an image too, adding
  // that image as asset to that actor.

  // Under live-reload development, the preview image only works the
  // first time you drag a particular asset.  It works correctly in a
  // static preview or release build.

  const mIndexLabel = displayIndex != null && (
    <div className={classNames("asset-card-display-index", operationScope)}>
      <p>
        <code>{displayIndex}</code>
      </p>
    </div>
  );

  return (
    <CaptiveContextMenu.Container
      className={kFocusGroupItemClassName}
      onClick={groupedFocusManager.onItemClick}
    >
      <div className={classes}>
        <DragPreviewImage connect={preview} src={dragPreview} />
        <div ref={dropRef}>
          <div ref={dragRef}>
            <div className="drag-masked-card">
              <div className="content">
                <div className="AssetCardContent">
                  <div className="thumbnail">
                    <AssetThumbnail presentationData={presentation} />
                  </div>
                  <div className="label">
                    <pre>{label}</pre>
                  </div>
                </div>
                {mIndexLabel}
                <AssetCardDropdown
                  operationScope={operationScope}
                  presentation={assetPresentation}
                  deleteIsAllowed={canBeDeleted}
                />
              </div>
              <div className="drag-mask" />
            </div>
          </div>
        </div>
      </div>
    </CaptiveContextMenu.Container>
  );
};
