import scratchblocks from "scratchblocks";

import ga from "scratchblocks/locales/ga.json";

const kExtraLanguages = { ga };

////////////////////////////////////////////////////////////////////////

const kLanguagesOption = (() => {
  const langCodes = ["en", ...Object.keys(kExtraLanguages)];

  return langCodes;
})();

scratchblocks.loadLanguages(kExtraLanguages);

////////////////////////////////////////////////////////////////////////

/**
 * Convert scratchblocks text `scratchText` into SVG element, with
 * scaling.  The containing DIV needs to be scaled similarly when the
 * SVG is inserted into the DOM in a `useEffect()` of the relevant
 * component.
 */
export const makeScratchSVG = (
  scratchText: string,
  scale: number
): SVGElement => {
  const sbOptions = { style: "scratch3", scale, languages: kLanguagesOption };
  const sbDoc = scratchblocks.parse(scratchText, sbOptions);

  let sbSvg: SVGElement = scratchblocks.render(sbDoc, sbOptions);
  sbSvg.setAttribute("class", "scratchblocks");

  return sbSvg;
};
