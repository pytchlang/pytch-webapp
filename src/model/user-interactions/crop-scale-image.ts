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

const cropScaleImageSpecific: ICropScaleImageSpecific = {
  // Will be overwritten on launch():
  projectId: -1,
  setProjectId: action((state, projectId) => {
    state.projectId = projectId;
  }),

  // Will be overwritten on launch():
  assetName: "",
  setAssetName: action((state, assetName) => {
    state.assetName = assetName;
  }),

  // Will be overwritten on launch():
  existingCrop: identityCrop,
  setExistingCrop: action((state, existingCrop) => {
    state.existingCrop = existingCrop;
  }),

  // Will be overwritten on launch():
  sourceURL: new URL("data:,"),
  setSourceURL: action((state, sourceURL) => {
    state.sourceURL = sourceURL;
  }),

  // Will be overwritten on launch():
  originalSize: { width: 1, height: 1 },
  setOriginalSize: action((state, originalSize) => {
    state.originalSize = originalSize;
  }),
};
