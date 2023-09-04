import React from "react";

type AssetImageThumbnailProps = {
  image: HTMLImageElement;
  maxSize: number;
};

export const AssetImageThumbnail: React.FC<AssetImageThumbnailProps> = ({
  image,
  maxSize,
}) => {
  const maxSizeStr = `${maxSize}px`;

  const maybeConstrainWidth =
    image.width >= image.height && image.width > maxSize
      ? maxSizeStr
      : undefined;

  const maybeConstrainHeight =
    image.height > image.width && image.height > maxSize
      ? maxSizeStr
      : undefined;

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
