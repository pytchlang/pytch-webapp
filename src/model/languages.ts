// The single source of truth for which languages the app supports,
// both for its UI and for resources (demos, tutorials).
//
// To add a language:
//
// * Add its code to `kLanguagePreferenceOrder` and its name to
//   `kLanguageDisplayNames`.  The type checker will then point out
//   where else it must be added within this repo (e.g., the
//   scratchblocks locales in "scratchblocks-render.ts").
// * Add its translations under "src/data/i18n-by-ns/"; a unit test
//   checks these directories match `kLanguagePreferenceOrder`.
// * Add it to KNOWN_TUTORIAL_LANGUAGES in pytch-build's
//   "tutorial_history.py", which must be kept in sync by hand.

/** Languages the app supports, for both its UI and resources.  The
 * order is that in which a resource's language variants are preferred
 * after the user's UI language (see "resource-language.ts").  It is
 * also the order in which languages are offered in language menus. */
export const kLanguagePreferenceOrder = ["en", "ga", "de"] as const;

export type LanguageCode = (typeof kLanguagePreferenceOrder)[number];

/** The name of each language, in that language. */
const kLanguageDisplayNames: Record<LanguageCode, string> = {
  en: "English",
  ga: "Gaeilge",
  de: "Deutsch",
};

/** Whether `code` is the code of one of the supported languages. */
export function isLanguageCode(code: string): code is LanguageCode {
  return (kLanguagePreferenceOrder as ReadonlyArray<string>).includes(code);
}

/** Return the name (in that language) of the language with the given
 * `lngCode`, or the code itself if it is not one of the supported
 * languages. */
export function languageDisplayName(lngCode: string): string {
  return isLanguageCode(lngCode) ? kLanguageDisplayNames[lngCode] : lngCode;
}
