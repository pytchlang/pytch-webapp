import scratchblocks from "scratchblocks";
import i18next from "i18next";
import { supportedLanguages } from "./i18n";

// To add a new language, import it here with name matching its language
// code.  We get "en" by default from scratchblocks, so it's not present
// here.
//
import ga from "scratchblocks/locales/ga.json";
import de from "scratchblocks/locales/de.json";
//
// and include it in this object:
//
const kExtraLanguages = { ga, de };

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

// The parts of the (untyped) scratchblocks document model which we use
// to build a plain-text version of a parsed document.  Each node has
// one of the "isWhatever" flags set.
type SbNode = {
  isLabel?: boolean;
  isIcon?: boolean;
  isInput?: boolean;
  isBlock?: boolean;
  isScript?: boolean;
  isGlow?: boolean;
  isReporter?: boolean;
  isBoolean?: boolean;
  value?: string | number;
  name?: string;
  isColor?: boolean;
  children?: Array<SbNode>;
  blocks?: Array<SbNode>;
  child?: SbNode;
};

type SbDocument = { scripts: Array<SbNode> };

// Icons which carry meaning.  Others, such as the loop arrow at the end
// of a "repeat" block, are decorative.
const kSpeakableIconKeys = {
  greenFlag: "scratch-block.icon.green-flag",
  stopSign: "scratch-block.icon.stop-sign",
  turnLeft: "scratch-block.icon.turn-left",
  turnRight: "scratch-block.icon.turn-right",
} as const;

type SpeakableIconName = keyof typeof kSpeakableIconKeys;
const isSpeakableIconName = (name: string): name is SpeakableIconName =>
  Object.hasOwn(kSpeakableIconKeys, name);

const speakableTextFromNode = (node: SbNode, isNested: boolean): string => {
  if (node.isLabel) return String(node.value);

  if (node.isIcon) {
    const name = node.name ?? "";
    return isSpeakableIconName(name) ? i18next.t(kSpeakableIconKeys[name]) : "";
  }

  // An empty boolean slot, or a colour swatch, has no useful text.
  if (node.isInput) return node.isColor ? "" : String(node.value ?? "");

  if (node.isGlow && node.child != null)
    return speakableTextFromNode(node.child, isNested);

  if (node.isScript)
    return (node.blocks ?? [])
      .map((block) => speakableTextFromNode(block, false))
      .join(", ");

  if (node.isBlock) {
    const text = joinWords(
      (node.children ?? []).map((child) => speakableTextFromNode(child, true))
    );
    // Bracket reporters and booleans inside another block, to keep the
    // structure of, e.g., "item (pick random 1 to 6) of fruits".
    const isValue = node.isReporter || node.isBoolean;
    return isNested && isValue ? `(${text})` : text;
  }

  return "";
};

const joinWords = (words: Array<string>): string =>
  words.filter((word) => word !== "").join(" ");

/** Plain-text version of the parsed scratchblocks document `sbDoc`,
 * suitable as the accessible name of its rendering. */
export const speakableTextFromScratchDoc = (sbDoc: SbDocument): string =>
  sbDoc.scripts
    .map((script) => speakableTextFromNode(script, false))
    .join("; ");

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

  // Present the drawing to assistive technology as one image, rather
  // than as its separate fragments of text.
  const text = speakableTextFromScratchDoc(sbDoc);
  const label = i18next.t("scratch-block.accessible-name", {
    replace: { text },
  });
  sbSvg.setAttribute("role", "img");
  sbSvg.setAttribute("aria-label", label);

  return sbSvg;
};
