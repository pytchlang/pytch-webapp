import scratchblocks from "scratchblocks";

import ga from "scratchblocks/locales/ga.json";

const kExtraLanguages = { ga };

////////////////////////////////////////////////////////////////////////

function setsAreEqual(s1: Set<string>, s2: Set<string>): boolean {
  // Apparently we need to define this ourselves.

  const size = s1.size;
  if (s2.size !== size) {
    return false;
  }

  let vals1 = Array.from(s1);
  vals1.sort();
  let vals2 = Array.from(s2);
  vals2.sort();

  for (let i = 0; i !== size; ++i) {
    if (vals1[i] !== vals2[i]) {
      return false;
    }
  }

  return true;
}

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
