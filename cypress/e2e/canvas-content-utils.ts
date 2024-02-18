import { stageHeight } from "../../src/constants";

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

export type SolidColourRuns = Array<SolidColourRun>;

// A test will describe the solid-colour runs we expect to see in
// vertical slices taken at various horizontal offsets across the image.

type PixelStripSpec = {
  sliceOffset: number;
  runs: SolidColourRuns;
};

export type PixelStripSpecs = Array<PixelStripSpec>;

////////////////////////////////////////////////////////////////////////

/** Compute bool indicating whether the pixel-strip `gotPixels` contains
 * the given `expPixelRuns`.  Failures are annotated with the given
 * `tag`. */
const pixelStripMatches = (
  tag: string,
  gotPixels: ImageData,
  expPixelRuns: SolidColourRuns
) => {
  for (let runIdx = 0; runIdx !== expPixelRuns.length; ++runIdx) {
    const run = expPixelRuns[runIdx];
    for (let pxlIdx = run.begin; pxlIdx < run.end; ++pxlIdx) {
      const dataIdx0 = 4 * pxlIdx;
      const gotRGBA = gotPixels.data.slice(dataIdx0, dataIdx0 + 4);
      for (let i = 0; i < 4; ++i) {
        if (gotRGBA[i] !== run.colour[i]) {
          // Because of "return", we only log the first failure; this is
          // reasonable behaviour.
          cy.log(
            `${tag} run[${runIdx}] pxl[${pxlIdx}] should be` +
              ` ${run.colour} but is ${Array.from(gotRGBA)}`
          );
          return false;
        }
      }
    }
  }
  return true;
};

/** Compute bool indicating whether all the given `specs` are met.  Each
 * spec contains an `offset`, which is fed to the given `getPixelsFun`
 * to obtain the pixel-strip against which to apply the `runs` in that
 * spec. */
const allPixelStripsMatch = (
  getPixelsFun: (offset: number) => ImageData,
  specs: PixelStripSpecs
) => {
  for (let idx = 0; idx != specs.length; ++idx) {
    const spec = specs[idx];
    const pixels = getPixelsFun(spec.sliceOffset);
    if (!pixelStripMatches(`spec[${idx}]`, pixels, spec.runs)) {
      return false;
    }
  }
  return true;
};

////////////////////////////////////////////////////////////////////////

type CanvasOps = {
  allVStripsMatch: (specs: PixelStripSpecs) => boolean;
};

/** Compute a "canvas operations" object for the given jQuery `canvas`
 * element. The returned object has properties:
 *
 * `allVStripsMatch()`: function computing whether all pixel-strip specs
 * are satisfied by the canvas (see {@link allPixelStripsMatch}). */
export const canvasOpsFromJQuery = (
  $canvas: JQuery<HTMLElement>
): CanvasOps => {
  const canvas = $canvas[0] as HTMLCanvasElement;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx == null) throw new Error("could not get 2d context");

  const getVStrip = (sx: number) => ctx.getImageData(sx, 0, 1, stageHeight);

  const allVStripsMatch = (specs: PixelStripSpecs) =>
    allPixelStripsMatch(getVStrip, specs);

  return { allVStripsMatch };
};
