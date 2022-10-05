/// <reference types="cypress" />

// The bulk of this file is the description of what we expect to see as
// we work with the test image.

////////////////////////////////////////////////////////////////////////
//
// The image used for testing, and the colours we expect when using it.

const blueOrangeImage = {
  name: "blue-orange-crop-test.png",
  mimeType: "image/png",
};

const emptyColour = [0, 0, 0, 0];
const blueColour = [77, 151, 255, 255];
const orangeColour = [255, 191, 0, 255];

context("Crop and scale images", () => {
});
