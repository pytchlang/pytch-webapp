import { assertNever, hexSHA256 } from "../../utils";
import { ActorKind } from "../junior/structured-program";

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

  static contentHash(transform: AssetTransform): Promise<string> {
    switch (transform.targetType) {
      case "image": {
        const numberPieces = [
          transform.originX,
          transform.originY,
          transform.width,
          transform.height,
          transform.scale,
        ].map((x) => x.toExponential());
        const pieces = ["ImageTransform", ...numberPieces];
        const fingerprint = pieces.join("/");
        return hexSHA256(fingerprint);
      }
      case "audio":
        return hexSHA256(new ArrayBuffer(0));
      default:
        return assertNever(transform);
    }
  }
}

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

export type AssetPresentationData =
  | ImageAssetPresentationData
  | SoundAssetPresentationData;

export type AssetPresentationDataKind = AssetPresentationData["kind"];

type AssetOperationScope = "flat" | ActorKind;

export type AssetOperationContextKey =
  | `${AssetOperationScope}/${AssetPresentationDataKind}`
  | "flat/any";

export type AssetOperationContext = {
  scope: string;
  assetIndefinite: string;
};

const contextLUT = new Map<AssetOperationContextKey, AssetOperationContext>([
  ["flat/image", { scope: "your project", assetIndefinite: "an image" }],
  ["flat/sound", { scope: "your project", assetIndefinite: "a sound" }],
  ["flat/any", { scope: "your project", assetIndefinite: "an image or sound" }],
  ["sprite/image", { scope: "this sprite", assetIndefinite: "a Costume" }],
  ["sprite/sound", { scope: "this sprite", assetIndefinite: "a Sound" }],
  ["stage/image", { scope: "the stage", assetIndefinite: "a Backdrop" }],
  ["stage/sound", { scope: "the stage", assetIndefinite: "a Sound" }],
]);

// User should never see this:
export const unknownAssetOperationContext: AssetOperationContext = {
  scope: "the owner",
  assetIndefinite: "an asset",
};

export const assetOperationContextFromKey = (
  key: AssetOperationContextKey
): AssetOperationContext => contextLUT.get(key) ?? unknownAssetOperationContext;
