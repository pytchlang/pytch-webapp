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
import { useStoreActions } from "../../store";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { AssetThumbnail } from "../AssetThumbnail";

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

type AssetCardDropdownProps = {
  actorKind: ActorKind;
  assetKind: AssetPresentationDataKind;
  fullPathname: string;
  basename: string;
  deleteIsAllowed: boolean;
};
const AssetCardDropdown: React.FC<AssetCardDropdownProps> = ({
  actorKind,
  assetKind,
  fullPathname,
  basename,
  deleteIsAllowed,
}) => {
  return (
    <DropdownButton align="end" title="⋮">
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
  fullPathname: string;
  canBeDeleted: boolean;
};
export const AssetCard: React.FC<AssetCardProps> = ({
  assetKind,
  expectedPresentationKind,
  actorKind,
  assetPresentation,
  fullPathname,
  canBeDeleted,
}) => {
  const presentation = assetPresentation.presentation;
  if (presentation.kind !== expectedPresentationKind) {
    throw new Error(
      `expecting asset "${fullPathname}" to` +
        ` have presentation of kind "${expectedPresentationKind}"` +
        ` but it is of kind "${presentation.kind}"`
    );
  }

  const classes = classNames("AssetCard", `kind-${actorKind}`);
  const basename = AssetMetaDataOps.basename(fullPathname);

  return (
    <div className={classes}>
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
        assetKind={assetKind}
        fullPathname={fullPathname}
        basename={basename}
        deleteIsAllowed={canBeDeleted}
      />
    </div>
  );
};
