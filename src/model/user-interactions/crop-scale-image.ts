import { action, Action, computed, Computed, thunk, Thunk } from "easy-peasy";
import { IModalUserInteraction } from ".";
import { AssetLocator, UpdateAssetTransformDescriptor } from "../project";
import { ImageCropDescriptor, ImageDimensions } from "../asset";
import { ProjectId } from "../projects";

type ICropScaleImageBase = IModalUserInteraction<
  UpdateAssetTransformDescriptor
>;

type CropScaleImageInitState = AssetLocator & {
  existingCrop: ImageCropDescriptor;
  sourceURL: URL;
  originalSize: ImageDimensions;
};

interface ICropScaleImageSpecific extends CropScaleImageInitState {
  setProjectId: Action<ICropScaleImageSpecific, ProjectId>;
  setAssetName: Action<ICropScaleImageSpecific, string>;
  setExistingCrop: Action<ICropScaleImageSpecific, ImageCropDescriptor>;
  setSourceURL: Action<ICropScaleImageSpecific, URL>;
  setOriginalSize: Action<ICropScaleImageSpecific, ImageDimensions>;
}
