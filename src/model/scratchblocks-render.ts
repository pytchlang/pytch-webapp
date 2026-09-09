import scratchblocks from "scratchblocks";
import { supportedLanguages } from "./i18n";

// To add a new language, copy in its JSON file from the scratchblocks
// repo and import it here with name matching its language code.  We get
// "en" by default from scratchblocks, so it's not present here.
//
import ga from "scratchblocks/locales/ga.json";
//
// and include it in this object:
//
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

// Compute list of all language codes (base plus extra) and verify that
// all app-supported languages have been included.  This is a "developer
// error" in that the app will appear to not load if there's a problem
// and you will have to look in the console.
const kLanguagesOption = (() => {
  const langCodes = ["en", ...Object.keys(kExtraLanguages)];

  const supportedLangCodes = new Set(
    supportedLanguages.map((langInfo) => langInfo.lngCode)
  );

  if (!setsAreEqual(new Set(langCodes), supportedLangCodes)) {
    console.error("scratchblocks languages:", langCodes);
    console.error("app languages:", supportedLangCodes);
    throw new Error("scratchblocks language list mismatch");
  }

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
