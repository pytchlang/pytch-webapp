import React, { KeyboardEventHandler } from "react";
import classNames from "classnames";
import { AssetPresentation } from "../../model/asset";
import { PytchProgramKind, PytchProgramOps } from "../../model/pytch-program";
import { useStoreState } from "../../store";
import { AssetThumbnail } from "../AssetThumbnail";
import {
  useAssetCardDrag,
  useAssetCardDrop,
  AssetCardSwapWithAdjacentFuns,
  useAssetCardSwapWithAdjacent,
} from "./hooks";

import ImageAssetPreview from "../../images/drag-preview-image.png";
import SoundAssetPreview from "../../images/sound-wave-w96.png";
import { DragPreviewImage } from "react-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectId } from "../../model/project-core";
import { useRunFlow } from "../../model";
import { AssetMimeType } from "../../model/junior/structured-program/asset";
import {
  AssetOperationContextKey,
  AssetOperationScope,
} from "../../model/asset/core";
import { assertNever, copyTextToClipboard } from "../../utils";
import { pyStringRepr } from "../../skulpt-connection/utils";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import { kFocusGroupItemClassName } from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";

const pageKindFromOperationScope = (
  opScope: AssetOperationScope
): PytchProgramKind => {
  switch (opScope) {
    case "sprite":
    case "stage":
      return "per-method";
    case "flat":
      return "flat";
    default:
      return assertNever(opScope);
  }
};

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
  const pageKind = pageKindFromOperationScope(operationScope);
  const focusContext = useFocusContext(pageKind);
  const runRenameAsset = useRunFlow((f) => f.renameAssetFlow);

  const operationContextKey = `${operationScope}/${assetKind}` as const;
  const nameAffixes = PytchProgramOps.assetPathAffixes(fullPathname);
  const launchRename = () =>
    runRenameAsset({
      operationContextKey,
      fixedPrefix: nameAffixes.prefix,
      oldNameSuffix: nameAffixes.suffix,
      onDispose: focusContext.onDisposeManipulateAsset,
    });

  return (
    <CaptiveContextMenu.DropdownItem onInvoke={launchRename}>
      Rename
    </CaptiveContextMenu.DropdownItem>
  );
};

function useOnDeleteFun(
  isAllowed: boolean,
  operationScope: AssetOperationScope,
  assetKind: AssetMimeType,
  fullPathname: string
) {
  const pageKind = pageKindFromOperationScope(operationScope);
  const focusContext = useFocusContext(pageKind);
  const runDeleteAsset = useRunFlow((f) => f.deleteAssetFlow);

  const operationContextKey: AssetOperationContextKey = `${operationScope}/${assetKind}`;
  const displayName = PytchProgramOps.assetPathAffixes(fullPathname).suffix;

  return () => {
    if (!isAllowed) {
      console.warn(`forbidding attempt to delete "${fullPathname}"`);
      return;
    }

    runDeleteAsset({
      operationContextKey,
      name: fullPathname,
      displayName,
      onDispose: focusContext.onDisposeManipulateAsset,
    });
  };
}

type DeleteDropdownItemProps = {
  operationScope: AssetOperationScope;
  assetKind: AssetMimeType;
  fullPathname: string;
  isAllowed: boolean;
};
const DeleteDropdownItem: React.FC<DeleteDropdownItemProps> = ({
  operationScope,
  assetKind,
  fullPathname,
  isAllowed,
}) => {
  const onDelete = useOnDeleteFun(
    isAllowed,
    operationScope,
    assetKind,
    fullPathname
  );

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
  operationScope: AssetOperationScope;
  assetKind: AssetMimeType;
  projectId: ProjectId;
  presentation: AssetPresentation;
};
const CropScaleDropdownItem: React.FC<CropScaleDropdownItemProps> = ({
  operationScope,
  assetKind,
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

  const operationContextKey: AssetOperationContextKey = `${operationScope}/${assetKind}`;
  const onClick = () => {
    runCropScaleImage({
      projectId,
      assetName: presentation.name,
      operationContextKey,
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

type CopyAssetNameDropdownItemProps = {
  assetName: string;
};
const CopyAssetNameDropdownItem: React.FC<CopyAssetNameDropdownItemProps> = ({
  assetName,
}) => {
  const nameStringLiteral = pyStringRepr(assetName);
  const onCopyName = () => {
    copyTextToClipboard(nameStringLiteral);
  };
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
  swapFuns: AssetCardSwapWithAdjacentFuns;
};
const AssetCardDropdown: React.FC<AssetCardDropdownProps> = ({
  operationScope,
  presentation,
  deleteIsAllowed,
  swapFuns,
}) => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const fullPathname = presentation.assetInProject.name;
  const displayName = PytchProgramOps.assetPathAffixes(fullPathname).suffix;
  const assetKind = presentation.presentation.kind;

  const nop = () => void 0;
  const mReorderItems =
    swapFuns == null ? (
      <></>
    ) : (
      <>
        <CaptiveContextMenu.DropdownItem
          onInvoke={swapFuns.swapWithPrev != null ? swapFuns.swapWithPrev : nop}
          disabled={swapFuns.swapWithPrev == null}
        >
          Move one place earlier
        </CaptiveContextMenu.DropdownItem>
        <CaptiveContextMenu.DropdownItem
          onInvoke={swapFuns.swapWithNext != null ? swapFuns.swapWithNext : nop}
          disabled={swapFuns.swapWithNext == null}
        >
          Move one place later
        </CaptiveContextMenu.DropdownItem>
      </>
    );

  return (
    <CaptiveContextMenu.DropdownMenu>
      <CopyAssetNameDropdownItem
        assetName={displayName}
      />
      <CropScaleDropdownItem
        operationScope={operationScope}
        assetKind={assetKind}
        projectId={projectId}
        presentation={presentation}
      />
      <RenameDropdownItem
        operationScope={operationScope}
        assetKind={assetKind}
        fullPathname={fullPathname}
      />
      {mReorderItems}
      <DeleteDropdownItem
        operationScope={operationScope}
        assetKind={assetKind}
        fullPathname={fullPathname}
        isAllowed={deleteIsAllowed}
      />
    </CaptiveContextMenu.DropdownMenu>
  );
};

type AssetCardProps = {
  reorderingAllowed: boolean;
  assetKind: AssetMimeType;
  operationScope: AssetOperationScope;
  displayIndex: number | null;
  assetPresentation: AssetPresentation;
  canBeDeleted: boolean;
  prevPathname: string | undefined;
  nextPathname: string | undefined;
};
export const AssetCard: React.FC<AssetCardProps> = ({
  reorderingAllowed,
  assetKind,
  operationScope,
  displayIndex,
  assetPresentation,
  canBeDeleted,
  prevPathname,
  nextPathname,
}) => {
  const focusContext = useFocusContext();

  const fullPathname = assetPresentation.name;

  const swapFuns = useAssetCardSwapWithAdjacent(
    assetKind,
    reorderingAllowed,
    fullPathname,
    prevPathname,
    nextPathname
  );

  const [dragProps, dragRef, preview] = useAssetCardDrag(
    fullPathname,
    reorderingAllowed
  );
  const [dropProps, dropRef] = useAssetCardDrop(
    fullPathname,
    reorderingAllowed
  );

  const presentation = assetPresentation.presentation;
  if (presentation.kind !== assetKind) {
    throw new Error(
      `expecting asset "${fullPathname}" to` +
        ` have presentation of kind "${assetKind}"` +
        ` but it is of kind "${presentation.kind}"`
    );
  }

  const onDelete = useOnDeleteFun(
    canBeDeleted,
    operationScope,
    assetKind,
    fullPathname
  );

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

  const onKeyDown: KeyboardEventHandler = (evt) => {
    if (evt.key === "Delete") {
      onDelete();
    }
  };

  return (
    <CaptiveContextMenu.Container
      className={kFocusGroupItemClassName}
      onClick={focusContext.onGroupItemClick}
      onKeyDown={onKeyDown}
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
                  swapFuns={swapFuns}
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
