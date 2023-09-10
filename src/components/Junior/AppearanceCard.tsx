import React from "react";
import classNames from "classnames";
import { AssetPresentation } from "../../model/asset";
import {
  ActorKind,
  AssetMetaDataOps,
} from "../../model/junior/structured-program";
import { AssetImageThumbnail } from "../AssetImageThumbnail";
import { useStoreActions } from "../../store";
import { Dropdown } from "react-bootstrap";

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

type AppearanceCardProps = {
  actorKind: ActorKind;
  assetPresentation: AssetPresentation;
  fullPathname: string;
};
export const AppearanceCard: React.FC<AppearanceCardProps> = ({
  actorKind,
  assetPresentation,
  fullPathname,
}) => {
  const presentation = assetPresentation.presentation;
  if (presentation.kind !== "image") {
    throw new Error(
      `expecting asset "${fullPathname}" to` +
        ` have presentation of kind "image"` +
        ` but it is of kind "${presentation.kind}"`
    );
  }

  const classes = classNames("AppearanceCard", `kind-${actorKind}`);
  const basename = AssetMetaDataOps.basename(fullPathname);

  return (
    <div className={classes}>
      <div className="AppearanceCardContent">
        <div className="thumbnail">
          <AssetImageThumbnail image={presentation.image} maxSize={120} />
        </div>
        <div className="label">
          <pre>{basename}</pre>
        </div>
      </div>
    </div>
  );
};
