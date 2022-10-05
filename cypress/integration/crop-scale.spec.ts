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

////////////////////////////////////////////////////////////////////////
//
// The original source image is 360×240, centred on a 480×360 stage.
// All margins should be 60.

const allEmpty: SolidColourRuns = [{ begin: 0, end: 360, colour: emptyColour }];

const emptyBlueEmptyFull: SolidColourRuns = [
  // 0
  { begin: 0, end: 59, colour: emptyColour },
  // +60 = 60
  { begin: 61, end: 299, colour: blueColour },
  // +240 = 300
  { begin: 301, end: 360, colour: emptyColour },
  // +60 = 360
];

const emptyBlueOrangeBlueEmptyFull: SolidColourRuns = [
  // 0
  { begin: 0, end: 59, colour: emptyColour },
  // +60 = 60
  { begin: 61, end: 91, colour: blueColour },
  // +32 = 92
  { begin: 93, end: 139, colour: orangeColour },
  // +48 = 140
  { begin: 141, end: 299, colour: blueColour },
  // +160 = 300
  { begin: 301, end: 360, colour: emptyColour },
  // +60 = 360
];

const expPixelStripsFull: PixelStripSpecs = [
  // 0
  { sliceOffset: 1, runs: allEmpty },
  { sliceOffset: 59, runs: allEmpty },
  // +60 = 60
  { sliceOffset: 61, runs: emptyBlueEmptyFull },
  { sliceOffset: 75, runs: emptyBlueEmptyFull },
  // +16 = 76
  { sliceOffset: 77, runs: emptyBlueOrangeBlueEmptyFull },
  { sliceOffset: 139, runs: emptyBlueOrangeBlueEmptyFull },
  // +64 = 140
  { sliceOffset: 141, runs: emptyBlueEmptyFull },
  { sliceOffset: 419, runs: emptyBlueEmptyFull },
  // +280 = 420
  { sliceOffset: 421, runs: allEmpty },
  { sliceOffset: 479, runs: allEmpty },
  // +60 = 480
];

context("Crop and scale images", () => {
});
