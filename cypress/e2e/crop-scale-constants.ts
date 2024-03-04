////////////////////////////////////////////////////////////////////////
//
// The image used for testing, and the colours we expect when using it.
//
// In separate file to allow use by specs besides "crop-scale.spec".

import { ArrayRGBA } from "../support/types";

export const blueOrangeImage = {
  name: "blue-orange-crop-test.png",
  mimeType: "image/png",
};

export const emptyColour = [0, 0, 0, 0] as ArrayRGBA;
export const whiteColour = [255, 255, 255, 255] as ArrayRGBA;
export const blueColour = [77, 151, 255, 255] as ArrayRGBA;
export const orangeColour = [255, 191, 0, 255] as ArrayRGBA;
