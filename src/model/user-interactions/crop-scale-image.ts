import { Action } from "easy-peasy";
import { AssetLocator, UpdateAssetTransformDescriptor } from "../project";
import {
  ImageCropSourceDescriptor,
  ImageCropDescriptor,
  ImageDimensions,
  AssetOperationContextKey,
  AssetOperationContext,
  assetOperationContextFromKey,
} from "../asset";
import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  alwaysSubmittable,
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  runStateAction,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";

type CropScaleImageRunArgs = AssetLocator & {
  operationContextKey: AssetOperationContextKey;
  existingCrop: ImageCropDescriptor;
  sourceURL: URL;
  originalSize: ImageDimensions;
};

type CropScaleImageRunState = Omit<
  CropScaleImageRunArgs,
  "operationContextKey"
> & {
  operationContext: AssetOperationContext;
  displayedNewCrop: ImageCropSourceDescriptor;
  newScale: number;
};

type CropScaleImageBase = AsyncUserFlowSlice<
  IPytchAppModel,
  CropScaleImageRunArgs,
  CropScaleImageRunState
>;

type SAction<ArgT> = Action<CropScaleImageBase, ArgT>;

type CropScaleImageActions = {
  setNewScale: SAction<number>;
  setDisplayedNewCrop: SAction<ImageCropSourceDescriptor>;
  setEffectiveNewCrop: SAction<ImageCropSourceDescriptor>;
};

export type CropScaleImageFlow = CropScaleImageBase & CropScaleImageActions;

async function prepare(
  args: CropScaleImageRunArgs
): Promise<CropScaleImageRunState> {
  const operationContext = assetOperationContextFromKey(
    args.operationContextKey
  );

  const existingCropIsIdentity = eqCropSources(args.existingCrop, identityCrop);
  const initialDisplayCrop = existingCropIsIdentity
    ? zeroCrop
    : args.existingCrop;

  return {
    projectId: args.projectId,
    assetName: args.assetName,
    existingCrop: args.existingCrop,
    sourceURL: args.sourceURL,
    originalSize: args.originalSize,
    operationContext,
    displayedNewCrop: initialDisplayCrop,
    newScale: args.existingCrop.scale,
  };
}

async function attempt(
  runState: CropScaleImageRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  const effectiveNewCrop = cropIsZeroSize(runState.displayedNewCrop)
    ? identityCrop
    : runState.displayedNewCrop;

  const descriptor: UpdateAssetTransformDescriptor = {
    projectId: runState.projectId,
    assetName: runState.assetName,
    operationContext: runState.operationContext,
    newTransform: {
      targetType: "image",
      ...effectiveNewCrop,
      scale: runState.newScale,
    },
  };

  await actions.activeProject.updateAssetTransformAndSync(descriptor);

  return noModalWithVoid;
}

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

export function effectiveCropFromDisplayedCrop(
  displayedCrop: ImageCropSourceDescriptor
) {
  return cropIsZeroSize(displayedCrop) ? identityCrop : displayedCrop;
}

export let cropScaleImageFlow: CropScaleImageFlow = (() => {
  const specificSlice: CropScaleImageActions = {
    setNewScale: setRunStateProp("newScale"),
    setDisplayedNewCrop: setRunStateProp("displayedNewCrop"),
    setEffectiveNewCrop: runStateAction((state, crop) => {
      const cropIsIdentity = eqCropSources(crop, identityCrop);
      state.displayedNewCrop = cropIsIdentity ? zeroCrop : crop;
    }),
  };

  return asyncUserFlowSlice(specificSlice, {
    prepare,
    isSubmittable: alwaysSubmittable,
    attempt,
  });
})();

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
