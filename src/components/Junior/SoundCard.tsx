import React from "react";
import classNames from "classnames";
import { AssetPresentation } from "../../model/asset";
import {
  ActorKind,
  AssetMetaDataOps,
} from "../../model/junior/structured-program";
import SoundWaveIcon from "../../images/sound-wave.png";

// TODO: Factor out common code between this and AppearanceCard.

type SoundCardProps = {
  actorKind: ActorKind;
  assetPresentation: AssetPresentation;
  fullPathname: string;
};

export const SoundCard: React.FC<SoundCardProps> = ({
  actorKind,
  assetPresentation,
  fullPathname,
}) => {
  const presentation = assetPresentation.presentation;
  if (presentation.kind !== "sound") {
    throw new Error(
      `expecting asset "${fullPathname}" to` +
        ` have presentation of kind "sound"` +
        ` but it is of kind "${presentation.kind}"`
    );
  }

  const classes = classNames("SoundCard", `kind-${actorKind}`);
  const basename = AssetMetaDataOps.basename(fullPathname);

  return (
    <div className={classes}>
      <div className="SoundCardContent">
        <div className="thumbnail">
          <div className="asset-preview">
            <img src={SoundWaveIcon} alt="Sound-Wave" />
          </div>
        </div>
        <div className="label">
          <pre>{basename}</pre>
        </div>
      </div>
    </div>
  );
};
