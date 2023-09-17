import React from "react";
import { AssetPresentationData } from "../model/asset";
import { AssetImageThumbnail } from "./AssetImageThumbnail";
import SoundWaveIcon from "../images/sound-wave.png";
import { assertNever } from "../utils";

type AssetThumbnailProps = {
  presentationData: AssetPresentationData;
};
export const AssetThumbnail: React.FC<AssetThumbnailProps> = ({
  presentationData,
}) => {
  switch (presentationData.kind) {
    case "image":
      return (
        <AssetImageThumbnail image={presentationData.image} maxSize={120} />
      );
    case "sound":
      return (
        <div className="asset-preview">
          <img src={SoundWaveIcon} alt="Sound-Wave" />
        </div>
      );
    default:
      return assertNever(presentationData);
  }
};
