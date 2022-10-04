import React from "react";
import { useStoreActions, useStoreState } from "../store";
import Modal from "react-bootstrap/Modal";
import ReactCrop from "react-image-crop";
import Form from "react-bootstrap/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Crop as ReactCropSpec } from "react-image-crop";
import { ImageCropSourceDescriptor, ImageDimensions } from "../model/asset";

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

type StageMockupProps = {
  sourceURL: URL;
  sourceCrop: ImageCropSourceDescriptor;
  originalSize: ImageDimensions;
  scale: number;
};

const StageMockup: React.FC<StageMockupProps> = ({
  sourceURL,
  sourceCrop,
  originalSize,
  scale,
}) => {
  // Adjust for preview stage being 0.75 the size of the real Stage:
  scale *= 0.75;
  const scaleXfm = `scale(${scale})`;

  const outputWd = originalSize.width * sourceCrop.width * scale;
  const outputHt = originalSize.height * sourceCrop.height * scale;

  // We need the values before applying "scale", because they will be
  // applied to the source image first via a translate() transform.
  const topLeftX = originalSize.width * sourceCrop.originX;
  const topLeftY = originalSize.height * sourceCrop.originY;
  const translateXfm = `translate(-${topLeftX}px, -${topLeftY}px)`;

  return (
    <div className="StageMockup">
      <div className="image-preview">
        <div
          className="image-container"
          style={{
            width: `${outputWd}px`,
            height: `${outputHt}px`,
            overflow: "hidden",
          }}
        >
          <img
            alt="preview of effect of cropping and scaling"
            src={sourceURL.toString()}
            style={{
              transformOrigin: "left top",
              transform: `${scaleXfm} ${translateXfm}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const maxScale = 10.0;
const minScale = 1.0 / 25.0;
const logScaleRange = Math.log(maxScale) - Math.log(minScale);

const rangeValueForScale = (scale: number): number => {
  if (scale > maxScale) return 1.0;
  if (scale < minScale) return 0.0;

  const logOffset = Math.log(scale) - Math.log(minScale);
  return logOffset / logScaleRange;
};

const scaleForRangeValue = (rangeValue: number): number => {
  if (rangeValue < 0.0) return minScale;
  if (rangeValue > 1.0) return maxScale;

  const logOffset = rangeValue * logScaleRange;
  const logScale = Math.log(minScale) + logOffset;
  return Math.exp(logScale);
};

const UnitRangeFormControl: React.FC<{
  value: number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}> = (props) => {
  return (
    <div className="scale-range-container">
      <FontAwesomeIcon icon="image" size="1x" />
      <Form.Control
        min={0.0}
        max={1.0}
        type="range"
        step="any"
        {...props}
      />{" "}
      <FontAwesomeIcon icon="image" size="3x" />
    </div>
  );
};

export const CropScaleImageModal = () => {
  const {
    isActive,
    displayedNewCrop,
    newScale,
    sourceURL,
  } = useStoreState(
    (state) => state.userConfirmations.cropScaleImageInteraction
  );

  const {
    dismiss,
    setDisplayedNewCrop,
    setEffectiveNewCrop,
    setNewScale,
  } = useStoreActions(
    (actions) => actions.userConfirmations.cropScaleImageInteraction
  );

  const handleClose = () => dismiss();

  const setScaleFromEvent: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const rangeValue = parseFloat(e.target.value);
    setNewScale(scaleForRangeValue(rangeValue));
  };

  const pctCrop = percentCropFromProportionCrop(displayedNewCrop);

  return (
    <Modal
      className="CropScaleImage"
      show={isActive}
      onHide={handleClose}
      animation={false}
      backdrop="static"
      centered
    >
      <Modal.Header>
        <Modal.Title>Adjust image</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="outer-content">
          <div className="left-content">
            <h2>Crop and scale:</h2>
            <div className="crop-container">
              <ReactCrop
                crop={pctCrop}
                onChange={(_pxCrop, pctCrop) =>
                  setDisplayedNewCrop(proportionCropFromPercentCrop(pctCrop))
                }
                onComplete={(_pxCrop, pctCrop) =>
                  setEffectiveNewCrop(proportionCropFromPercentCrop(pctCrop))
                }
              >
                <img alt="Full source" src={sourceURL.toString()} />
              </ReactCrop>
            </div>
            <UnitRangeFormControl
              value={rangeValueForScale(newScale)}
              onChange={setScaleFromEvent}
            />
          </div>
          <div className="right-content">
            <h2>Preview on Stage:</h2>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
