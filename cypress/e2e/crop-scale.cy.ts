/// <reference types="cypress" />

import { ArrayRGBA } from "../support/types";
import {
  PixelStripSpecs,
  SolidColourRuns,
  canvasOpsFromJQuery,
} from "./canvas-content-utils";
import {
  blueOrangeImage,
  emptyColour,
  blueColour,
  orangeColour,
  whiteColour,
} from "./crop-scale-constants";

// The bulk of this file is the description of what we expect to see as
// we work with the test image.

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

const borderBlueOrangeBlueBorderFull = (
  borderColour: ArrayRGBA
): SolidColourRuns => [
  // 0
  { begin: 0, end: 59, colour: borderColour },
  // +60 = 60
  { begin: 61, end: 91, colour: blueColour },
  // +32 = 92
  { begin: 93, end: 139, colour: orangeColour },
  // +48 = 140
  { begin: 141, end: 299, colour: blueColour },
  // +160 = 300
  { begin: 301, end: 360, colour: borderColour },
  // +60 = 360
];

const emptyBlueOrangeBlueEmptyFull =
  borderBlueOrangeBlueBorderFull(emptyColour);

const whiteBlueOrangeBlueWhiteFull =
  borderBlueOrangeBlueBorderFull(whiteColour);

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

////////////////////////////////////////////////////////////////////////
//
// After the crop, we should have a 100×100 blue image containing a
// 64×48 orange rectangle with a left border of 8 and a top border of
// 16.  This image should be in the middle of the stage.

const emptyBlueEmptyCropped: SolidColourRuns = [
  // 0
  { begin: 0, end: 129, colour: emptyColour },
  // +130 = 130
  { begin: 131, end: 229, colour: blueColour },
  // +100 = 230
  { begin: 231, end: 360, colour: emptyColour },
  // +130 = 360
];

const borderBlueOrangeBlueBorderCropped = (
  borderColour: ArrayRGBA
): SolidColourRuns => [
  // 0
  { begin: 0, end: 129, colour: borderColour },
  // +130 = 130
  { begin: 131, end: 145, colour: blueColour },
  // +16 = 146
  { begin: 161, end: 193, colour: orangeColour },
  // +48 = 194
  { begin: 195, end: 229, colour: blueColour },
  // +36 = 230
  { begin: 231, end: 360, colour: borderColour },
  // +130 = 360
];

const emptyBlueOrangeBlueEmptyCropped: SolidColourRuns = [
  // 0
  { begin: 0, end: 129, colour: emptyColour },
  // +130 = 130
  { begin: 131, end: 145, colour: blueColour },
  // +16 = 146
  { begin: 161, end: 193, colour: orangeColour },
  // +48 = 194
  { begin: 195, end: 229, colour: blueColour },
  // +36 = 230
  { begin: 231, end: 360, colour: emptyColour },
  // +130 = 360
];

const expPixelStripsCropped: PixelStripSpecs = [
  // 0
  { sliceOffset: 1, runs: allEmpty },
  { sliceOffset: 189, runs: allEmpty },
  // +190 = 190
  { sliceOffset: 191, runs: emptyBlueEmptyCropped },
  { sliceOffset: 197, runs: emptyBlueEmptyCropped },
  // +8 = 198
  { sliceOffset: 199, runs: emptyBlueOrangeBlueEmptyCropped },
  { sliceOffset: 245, runs: emptyBlueOrangeBlueEmptyCropped },
  // +64 = 262
  { sliceOffset: 263, runs: emptyBlueEmptyCropped },
  { sliceOffset: 289, runs: emptyBlueEmptyCropped },
  // +28 = 290
  { sliceOffset: 291, runs: allEmpty },
  { sliceOffset: 479, runs: allEmpty },
  // +190 = 480
];

////////////////////////////////////////////////////////////////////////
//
// After cropping and scaling, we should have a 200×200 image containing
// a 128×96 orange rectangle with a left border of 16 and a top border
// of 32.  This image should be in the middle of the stage.  We have to
// be more tolerant than in other tests because the pixel colour
// differences caused by however the browser chooses to do anti-aliasing
// when upscaling compound on top of the errors caused by non-integer
// pixel-grid alignment of the ReactCrop control.

const emptyBlueEmptyCroppedScaled: SolidColourRuns = [
  // 0
  { begin: 0, end: 77, colour: emptyColour },
  // +80 = 80
  { begin: 83, end: 277, colour: blueColour },
  // +200 = 280
  { begin: 283, end: 360, colour: emptyColour },
  // +80 = 360
];

const emptyBlueOrangeBlueEmptyCroppedScaled: SolidColourRuns = [
  // 0
  { begin: 0, end: 77, colour: emptyColour },
  // +80 = 80
  { begin: 83, end: 109, colour: blueColour },
  // +32 = 112
  { begin: 115, end: 205, colour: orangeColour },
  // +96 = 208
  { begin: 211, end: 277, colour: blueColour },
  // +72 = 280
  { begin: 283, end: 360, colour: emptyColour },
  // +80 = 360
];

const expPixelStripsCroppedScaled: PixelStripSpecs = [
  // 0
  { sliceOffset: 1, runs: allEmpty },
  { sliceOffset: 138, runs: allEmpty },
  // +140 = 140
  { sliceOffset: 142, runs: emptyBlueEmptyCroppedScaled },
  { sliceOffset: 154, runs: emptyBlueEmptyCroppedScaled },
  // +16 = 156
  { sliceOffset: 158, runs: emptyBlueOrangeBlueEmptyCroppedScaled },
  { sliceOffset: 282, runs: emptyBlueOrangeBlueEmptyCroppedScaled },
  // +128 = 284
  { sliceOffset: 286, runs: emptyBlueEmptyCroppedScaled },
  { sliceOffset: 338, runs: emptyBlueEmptyCroppedScaled },
  // +56 = 340
  { sliceOffset: 342, runs: allEmpty },
  { sliceOffset: 479, runs: allEmpty },
  // +140 = 480
];

////////////////////////////////////////////////////////////////////////

/** Drag the pointer from (`x0`, `y0`) to (`x1`, `y1`) within the
 * `ReactCrop` component. */
const dragPointerOnCropControl = (
  x0: number,
  y0: number,
  x1: number,
  y1: number
) => {
  cy.get(".ReactCrop")
    .trigger("pointerdown", x0, y0)
    .trigger("pointermove", x1, y1)
    .trigger("pointerup");
};

// TODO: Should we import these from the component?
const maxScale = 10.0;
const minScale = 1.0 / 25.0;
const logScaleRange = Math.log(maxScale) - Math.log(minScale);

const rangeValueForScale = (scale: number): number => {
  if (scale > maxScale) return 1.0;
  if (scale < minScale) return 0.0;

  const logOffset = Math.log(scale) - Math.log(minScale);
  return logOffset / logScaleRange;
};

/** Set the value of the slider which controls the scaling applied to
 * the image. */
const setScaleSlider = (scale: number) => {
  cy.get(".scale-range-container input")
    .invoke("val", rangeValueForScale(scale))
    .trigger("change");
};

////////////////////////////////////////////////////////////////////////

// We don't always get pixel-accurate positioning.  I think this is
// because the client rect isn't always aligned on the pixel grid, so
// when we send synthetic pointer events, the coords reported to the
// ReactCrop component might be off by up to slightly more than a whole
// pixel.

const withinTightTol = (x: number, y: number) => Math.abs(x - y) < 1.0e-6;
const withinLooseTol = (x: number, y: number) => Math.abs(x - y) < 1.25;

/** Compute a function asserting that a jQuery element has a CSS
 * transform with the given `expScale` and (`expTranslationX`,
 * `expTranslationY`).  The scale is applied to the translation
 * components, meaning that the expected translation components should
 * be provided as if applied *before* scaling. */
const assertTransformMatches =
  (expScale: number, expTranslationX: number, expTranslationY: number) =>
  ($jElt: JQuery<HTMLElement>) => {
    // Get transform expressed as a matrix:
    const gotTransformString = getComputedStyle($jElt[0]).transform;
    const mRegExpMatch = /^matrix\((.*)\)$/.exec(gotTransformString);
    if (mRegExpMatch == null) throw new Error("could not parse computed style");

    const matrixElts = mRegExpMatch[1].split(",").map(parseFloat);

    let asExpected = true;
    const check = (
      eltIdx: number,
      expVal: number,
      floatsAcceptablyClose: (x: number, y: number) => boolean
    ) => {
      const gotVal = matrixElts[eltIdx];
      if (!floatsAcceptablyClose(gotVal, expVal)) {
        cy.log(`expecting elt ${eltIdx} to be ${expVal} but was ${gotVal}`);
        asExpected = false;
      }
    };

    check(0, expScale, withinTightTol);
    check(1, 0.0, withinTightTol);
    check(2, 0.0, withinTightTol);
    check(3, expScale, withinTightTol);
    check(4, expScale * -expTranslationX, withinLooseTol);
    check(5, expScale * -expTranslationY, withinLooseTol);

    cy.wrap(asExpected).should("be.true");
  };

/** Assert that the stage mockup has the given transformation.  The
 * given `expScale` should *include* the factor of `0.75` which is used
 * because the stage mockup is 3/4 size compared to the real stage.
 *
 * @see {@link assertTransformMatches}
 */
const assertMockStageTransformMatches = (
  expScale: number,
  expTranslationX: number,
  expTranslationY: number
) => {
  cy.get(".StageMockup img").then(
    assertTransformMatches(expScale, expTranslationX, expTranslationY)
  );
};

////////////////////////////////////////////////////////////////////////

/** Open the drop-down menu for the test image, and click the Crop/scale
 * item within it. */
const launchCropScaleOnTestImage = () => {
  cy.pytchClickAssetDropdownItem("blue-orange-crop-test.png", "Crop/scale");
  cy.contains("Adjust image");
};

/** Click `OK`, to accept the changes to the transform. */
const acceptCropScale = () => {
  cy.get("button").contains("OK").click();
  cy.contains("Adjust image").should("not.exist");
};

/** Click `Cancel`, to reject the changes to the transform. */
const cancelCropScale = () => {
  cy.get("button").contains("Cancel").click();
  cy.contains("Adjust image").should("not.exist");
};

////////////////////////////////////////////////////////////////////////

context("Crop and scale images", () => {
  before(() => {
    cy.pytchExactlyOneProject({ extraAssets: [blueOrangeImage] });
    cy.pytchSetCodeWithDeIndent(`
    import pytch
    class Thing(pytch.Sprite):
        Costumes = ["blue-orange-crop-test.png"]
    `);
    cy.contains("blue-orange");
    cy.pytchGreenFlag();
  });

  it("does not show dropdown item for audio assets", () => {
    cy.pytchActivateAssetDropdown("sine-1kHz-2s.mp3");
    cy.contains("DELETE");
    cy.contains("Crop/scale").should("not.exist");
  });

  it("lets user crop", () => {
    cy.get("#pytch-canvas").then(($canvas) => {
      const cOps = canvasOpsFromJQuery($canvas);
      cy.waitUntil(() => cOps.allVStripsMatch(expPixelStripsFull)).then(() => {
        launchCropScaleOnTestImage();
        assertMockStageTransformMatches(0.75, 0.0, 0.0);

        dragPointerOnCropControl(8, 16, 108, 116);
        assertMockStageTransformMatches(0.75, 8.0, 16.0);

        acceptCropScale();

        // This will get us a whole new DOM subtree with a new canvas
        // object, so we have to find the new canvas.
        cy.pytchSwitchProject("Test seed project");
        cy.pytchGreenFlag();

        cy.get("#pytch-canvas").then(($canvas) => {
          const cOps = canvasOpsFromJQuery($canvas);
          cy.waitUntil(() => cOps.allVStripsMatch(expPixelStripsCropped)).then(
            () => {
              launchCropScaleOnTestImage();

              cy.get("button").contains("Reset").click();
              acceptCropScale();

              // And again.
              cy.pytchSwitchProject("Test seed project");
              cy.pytchGreenFlag();

              cy.get("#pytch-canvas").then(($canvas) => {
                const cOps = canvasOpsFromJQuery($canvas);
                cy.waitUntil(() => cOps.allVStripsMatch(expPixelStripsFull));
              });
            }
          );
        });
      });
    });
  });

  it("lets user cancel crop adjustment", () => {
    cy.get("#pytch-canvas").then(($canvas) => {
      const cOps = canvasOpsFromJQuery($canvas);
      cy.waitUntil(() => cOps.allVStripsMatch(expPixelStripsFull)).then(() => {
        launchCropScaleOnTestImage();
        dragPointerOnCropControl(8, 16, 108, 116);
        assertMockStageTransformMatches(0.75, 8.0, 16.0);

        cancelCropScale();

        cy.pytchSwitchProject("Test seed project");
        cy.pytchGreenFlag();

        cy.get("#pytch-canvas").then(($canvas) => {
          const cOps = canvasOpsFromJQuery($canvas);
          cy.waitUntil(() => cOps.allVStripsMatch(expPixelStripsFull));
        });
      });
    });
  });

  it("lets user scale a cropped sub-image", () => {
    cy.get("#pytch-canvas").then(($canvas) => {
      const cOps = canvasOpsFromJQuery($canvas);
      cy.waitUntil(() => cOps.allVStripsMatch(expPixelStripsFull)).then(() => {
        launchCropScaleOnTestImage();
        dragPointerOnCropControl(8, 16, 108, 116);
        assertMockStageTransformMatches(0.75, 8.0, 16.0);

        setScaleSlider(2.0);
        assertMockStageTransformMatches(1.5, 8.0, 16.0);
        acceptCropScale();

        cy.pytchSwitchProject("Test seed project");
        cy.pytchGreenFlag();

        cy.get("#pytch-canvas").then(($canvas) => {
          const cOps = canvasOpsFromJQuery($canvas);
          cy.waitUntil(() => cOps.allVStripsMatch(expPixelStripsCroppedScaled));
        });
      });
    });
  });
});
