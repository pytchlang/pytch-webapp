// The single source of truth for which languages the app supports,
// both for its UI and for resources (demos, tutorials).
//
// To add a language:
//
// * Add its code to `kLanguagePreferenceOrder`.  The type checker will
//   then point out where else it must be added within this repo (e.g.,
//   the scratchblocks locales in "scratchblocks-render.ts").
// * Add it to KNOWN_TUTORIAL_LANGUAGES in pytch-build's
//   "tutorial_history.py", which must be kept in sync by hand.

/** Languages the app supports, for both its UI and resources.  The
 * order is that in which a resource's language variants are preferred
 * after the user's UI language (see "resource-language.ts").  It is
 * also the order in which languages are offered in language menus. */
export const kLanguagePreferenceOrder = ["en", "ga", "de"] as const;

export type LanguageCode = (typeof kLanguagePreferenceOrder)[number];
