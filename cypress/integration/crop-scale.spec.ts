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

////////////////////////////////////////////////////////////////////////
//
// Types for saying what we expect to see.  We will make assertions
// about a one-pixel-wide slice taken vertically down the rendered
// stage.  With our image, these strips should consist of a small number
// of runs of solid colour.  We will allow a small amount of tolerance
// in the pixel-run specs and in the X values for where we take the
// slices.

type SolidColourRun = {
  begin: number;
  end: number;
  colour: Array<number>;
};

type SolidColourRuns = Array<SolidColourRun>;

// A test will describe the solid-colour runs we expect to see in
// vertical slices taken at various horizontal offsets across the image.

type PixelStripSpec = {
  sliceOffset: number;
  runs: SolidColourRuns;
};

type PixelStripSpecs = Array<PixelStripSpec>;

context("Crop and scale images", () => {
});
