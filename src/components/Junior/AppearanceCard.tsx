import React from "react";
import classNames from "classnames";
import { AssetPresentation } from "../../model/asset";
import {
  ActorKind,
  AssetMetaDataOps,
} from "../../model/junior/structured-program";
import { AssetImageThumbnail } from "../AssetImageThumbnail";

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
