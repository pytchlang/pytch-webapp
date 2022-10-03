import { action, Action, computed, Computed, thunk, Thunk } from "easy-peasy";
import { IModalUserInteraction } from ".";
import { AssetLocator, UpdateAssetTransformDescriptor } from "../project";
import {
  ImageCropSourceDescriptor,
  ImageCropDescriptor,
  ImageDimensions,
} from "../asset";
import { ProjectId } from "../projects";

type ICropScaleImageBase = IModalUserInteraction<
  UpdateAssetTransformDescriptor
>;

// We keep track of the existing crop and scale, to be able to offer the user
// this as the starting point for their adjustment.  A wrinkle is that if the
// user wants to select the entire source image, the "everything" crop is
// unwieldy to interact with, especially as the very first time they try to crop
// an image.  The natural starting operation is to try to drag out a crop
// rectangle, but this doesn't work inside the existing "everything" crop
// rectangle.  We address this by mapping the "everything" crop to a "nothing"
// crop for display purposes.  When the user drags out the "everything" crop, it
// shows as such until they complete the crop operation (let go of the mouse
// button).  At that point we store and display instead a "nothing" crop.  We
// provide a computed property for the "effective" crop, which is the one which
// describes what we really want to crop.  This is the same as the "displayed"
// crop except when the displayed crop is a "nothing" crop, in which case the
// "effective" crop is the "everything" crop.  This is all based on the
// assumption that a "nothing" crop is meaningless in that the user can not
// actually use a zero-area rectangle of the source image as an asset.

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

  displayedNewCrop: ImageCropSourceDescriptor;
  setDisplayedNewCrop: Action<
    ICropScaleImageSpecific,
    ImageCropSourceDescriptor
  >;

  effectiveNewCrop: Computed<
    ICropScaleImageSpecific,
    ImageCropSourceDescriptor
  >;
  setEffectiveNewCrop: Action<
    ICropScaleImageSpecific,
    ImageCropSourceDescriptor
  >;

  newScale: number;
  setNewScale: Action<ICropScaleImageSpecific, number>;
}

export const zeroCrop: ImageCropSourceDescriptor = {
  originX: 0.5,
  originY: 0.5,
  width: 0.0,
  height: 0.0,
};

const identityCrop: ImageCropDescriptor = {
  originX: 0.0,
  originY: 0.0,
  width: 1.0,
  height: 1.0,
  scale: 1.0,
};

const floatsClose = (x: number, y: number): boolean => Math.abs(x - y) < 1.0e-5;

const eqCropSources = (
  a: ImageCropSourceDescriptor,
  b: ImageCropSourceDescriptor
): boolean => {
  return (
    floatsClose(a.originX, b.originX) &&
    floatsClose(a.originY, b.originY) &&
    floatsClose(a.width, b.width) &&
    floatsClose(a.height, b.height)
  );
};

// Exact float comparison against zero is OK here.  (I think.)
const cropIsZeroSize = (crop: ImageCropSourceDescriptor): boolean =>
  crop.width === 0.0 && crop.height === 0.0;

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

  // Will be overwritten on launch():
  displayedNewCrop: zeroCrop,
  setDisplayedNewCrop: action((state, crop) => {
    state.displayedNewCrop = crop;
  }),

  effectiveNewCrop: computed((state) =>
    cropIsZeroSize(state.displayedNewCrop)
      ? identityCrop
      : state.displayedNewCrop
  ),
  setEffectiveNewCrop: action((state, crop) => {
    const cropIsIdentity = eqCropSources(crop, identityCrop);
    state.displayedNewCrop = cropIsIdentity ? zeroCrop : crop;
  }),

  newScale: 1.0,
  setNewScale: action((state, scale) => {
    state.newScale = scale;
  }),
};
