import React from "react";
import { useStoreActions, useStoreState } from "../store";
import Modal from "react-bootstrap/Modal";

import { Crop as ReactCropSpec } from "react-image-crop";
import { ImageCropSourceDescriptor } from "../model/asset";

// The react-image-crop interface works in percentages but the model
// state and the transformation functions work in proportions.  And the
// property names are different.  The below two functions convert
// back/forth between these two representations.

/** Compute a proportion-valued (`cropOriginX`, `cropOriginY`,
 * `cropWidth`, `cropHeight`) crop specifier given a percentage-valued
 * (`x`, `y`, `width`, `height`) crop specifier . */
const proportionCropFromPercentCrop = (
  pctCrop: ReactCropSpec
): ImageCropSourceDescriptor => ({
  originX: 0.01 * pctCrop.x,
  originY: 0.01 * pctCrop.y,
  width: 0.01 * pctCrop.width,
  height: 0.01 * pctCrop.height,
});

/** Compute a percentage-valued (`x`, `y`, `width`, `height`) crop
 * specifier given a proportion-valued (`cropOriginX`, `cropOriginY`,
 * `cropWidth`, `cropHeight`) crop specifier. */
const percentCropFromProportionCrop = (
  propCrop: ImageCropSourceDescriptor
): ReactCropSpec => ({
  x: 100.0 * propCrop.originX,
  y: 100.0 * propCrop.originY,
  width: 100.0 * propCrop.width,
  height: 100.0 * propCrop.height,
  unit: "%",
});

export const CropScaleImageModal = () => {
  const {
    isActive,
  } = useStoreState(
    (state) => state.userConfirmations.cropScaleImageInteraction
  );

  const {
    dismiss,
  } = useStoreActions(
    (actions) => actions.userConfirmations.cropScaleImageInteraction
  );

  const handleClose = () => dismiss();

  return (
    <Modal
      className="CropScaleImage"
      show={isActive}
      onHide={handleClose}
      animation={false}
      backdrop="static"
      centered
    >
    </Modal>
  );
};
