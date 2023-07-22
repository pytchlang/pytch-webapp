// Assets are identified by a hash of their contents.
export type AssetId = string;

export type ImageDimensions = { width: number; height: number };

/** Description of the source area within an image which is to be
 * cropped.  All values are proportions of the original image, i.e.,
 * values between 0.0 and 1.0.  The *origin* is the top-left corner of
 * the cropped sub-image.  It should be the case that `originX` +
 * `width` < 1.0 and also `originY` + `height` < 1.0. */
export type ImageCropSourceDescriptor = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

/** Description of a further scaling transform to apply to a cropped
 * sub-image.  The `scale` is proportional, e.g., 1.0 means no change
 * from the cropped source dimensions, 2.0 means double the size (in
 * each dimension), etc.  The same scaling is applied in both
 * dimensions. */
export type ImageCropOutputDescriptor = {
  scale: number;
};

/** Description of a crop/scale transform to apply to an image. See
 * contributing classes for details. */
export type ImageCropDescriptor = ImageCropSourceDescriptor &
  ImageCropOutputDescriptor;

// TODO: Add this, maybe with start-time/stop-time/gain?
// export type AudioTransformDescriptor = SOMETHING

type ImageTransform = {
  targetType: "image";
} & ImageCropDescriptor;

type AudioTransform = {
  targetType: "audio";
}; // TODO: Intersect with AudioTransformDescriptor when that exists.

export type AssetTransform = ImageTransform | AudioTransform;

export class AssetTransformOps {
  /** Return a new "no-op" transformation suitable for the given MIME
   * type.  The major types `"image"` and `"audio"` are supported. */
  static newNoop(mimeType: string): AssetTransform {
    const majorType = mimeType.split("/")[0];
    switch (majorType) {
      case "image":
        return {
          targetType: "image",
          originX: 0.0,
          originY: 0.0,
          width: 1.0,
          height: 1.0,
          scale: 1.0,
        };
      case "audio":
        return {
          targetType: "audio",
        };
      default:
        throw new Error(
          `no no-op transform for mime major-type "${majorType}"`
        );
    }
  }
}

// TODO: Gather these two into a map?

const noopImageTransform: ImageTransform = {
  targetType: "image",
  originX: 0.0,
  originY: 0.0,
  width: 1.0,
  height: 1.0,
  scale: 1.0,
};

const noopAudioTransform: AudioTransform = {
  targetType: "audio",
};

/** Return a 'no-op' transformation suitable for the given MIME type.
 * The major types `"image"` and `"audio"` are supported. */
export const noopTransform = (mimeType: string): AssetTransform => {
  const majorType = mimeType.split("/")[0];
  switch (majorType) {
    case "image":
      return noopImageTransform;
    case "audio":
      return noopAudioTransform;
    default:
      throw new Error(`no no-op transform for mime major-type "${majorType}"`);
  }
};

export interface IAssetInProject {
  name: string;
  mimeType: string;
  id: AssetId;
  transform: AssetTransform;
}

export interface ImageAssetPresentationData {
  kind: "image";
  image: HTMLImageElement;
  fullSourceImage: HTMLImageElement;
}

export interface SoundAssetPresentationData {
  kind: "sound";
  audioBuffer: AudioBuffer | null;
}
