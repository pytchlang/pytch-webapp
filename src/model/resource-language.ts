// Choosing between the language variants of a resource (demo or
// tutorial) according to the user's UI language.

/** Languages in which resources might be available, in the order in which
 * they should be preferred after the current UI language.  Any other
 * languages are preferred after these, in alphabetical order. */
export const kResourceLanguagePreferenceOrder = ["en", "ga", "de"];

/** Return a comparison function on language codes, which orders them
 * by preference given the current UI language `uiLanguage`.  The UI
 * language comes first, then those in `kResourceLanguagePreferenceOrder`,
 * in that order, then any others, alphabetically. */
export function cmpResourceLanguages(
  uiLanguage: string
): (a: string, b: string) => number {
  const nPreferred = kResourceLanguagePreferenceOrder.length;
  const rank = (language: string): number => {
    if (language === uiLanguage) return 0;
    const idx = kResourceLanguagePreferenceOrder.indexOf(language);
    return idx === -1 ? nPreferred + 1 : idx + 1;
  };

  return (a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return a < b ? -1 : a > b ? 1 : 0;
  };
}
