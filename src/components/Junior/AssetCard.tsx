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
  fullPathname: string;
};
const RenameDropdownItem: React.FC<RenameDropdownItemProps> = ({
  fullPathname,
}) => {
  const launchRenameAction = useStoreActions(
    (actions) => actions.userConfirmations.renameAssetInteraction.launch
  );

  const { actorId, basename } = AssetMetaDataOps.pathComponents(fullPathname);
  const launchRename = () =>
    launchRenameAction({ fixedPrefix: `${actorId}/`, oldNameSuffix: basename });

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
  const requestConfirmation = useStoreActions(
    (actions) => actions.userConfirmations.requestDangerousActionConfirmation
  );

  const onDelete = async () => {
    if (!isAllowed) {
      console.warn(`forbidding attempt to delete "${fullPathname}"`);
      return;
    }

    requestConfirmation({
      kind: "delete-project-asset",
      assetKind,
      assetName: displayName,
      actionIfConfirmed: {
        typePath: "activeProject.deleteAssetAndSync",
        payload: { name: fullPathname },
      },
    });
  };

  return (
    <Dropdown.Item className="danger" onClick={onDelete} disabled={!isAllowed}>
      DELETE
    </Dropdown.Item>
  );
};

type AssetCardDropdownProps = {
  assetKind: AssetPresentationDataKind;
  fullPathname: string;
  basename: string;
  deleteIsAllowed: boolean;
};
const AssetCardDropdown: React.FC<AssetCardDropdownProps> = ({
  assetKind,
  fullPathname,
  basename,
  deleteIsAllowed,
}) => {
  return (
    <DropdownButton align="end" title="⋮">
      <RenameDropdownItem fullPathname={fullPathname} />
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
        assetKind={assetKind}
        fullPathname={fullPathname}
        basename={basename}
        deleteIsAllowed={canBeDeleted}
      />
    </div>
  );
};