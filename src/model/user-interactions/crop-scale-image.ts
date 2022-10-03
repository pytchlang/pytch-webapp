import { IModalUserInteraction } from ".";
import { AssetLocator, UpdateAssetTransformDescriptor } from "../project";
import { ImageCropDescriptor, ImageDimensions } from "../asset";

type ICropScaleImageBase = IModalUserInteraction<
  UpdateAssetTransformDescriptor
>;

type CropScaleImageInitState = AssetLocator & {
  existingCrop: ImageCropDescriptor;
  sourceURL: URL;
  originalSize: ImageDimensions;
};
