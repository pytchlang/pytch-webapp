// Choosing between the language variants of a resource (demo or
// tutorial) according to the user's UI language.

/** Whether to show all resources (demos or tutorials), or only those
 * available in the current UI language. */
export type ResourceLanguageSelector = "all" | "ui-language";

/** Languages in which resources might be available, in the order in which
 * they should be preferred after the current UI language.  Any other
 * languages are preferred after these, in alphabetical order.
 *
 * Keep in sync by hand with `zTutorialLanguage` in
 * "tutorial-metadata.ts", with copies listed there. */
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

/** How to find, for an item, which resource it is a language variant
 * of (as a key), and which language it is in. */
export type LanguageVariantAccessors<ItemT> = {
  resourceKey: (item: ItemT) => string;
  language: (item: ItemT) => string;
};

/** Return one item per resource from the given `items`, which may
 * include several language variants of each resource.  Items with the
 * same `accessors.resourceKey()` are variants of the same resource.
 * For each resource, choose the variant whose language is most
 * preferred given the current UI language `uiLanguage` (see
 * `cmpResourceLanguages()`).  Resources are returned in the order of
 * their first appearance in `items`. */
export function preferredLanguageVariants<ItemT>(
  items: Array<ItemT>,
  accessors: LanguageVariantAccessors<ItemT>,
  uiLanguage: string
): Array<ItemT> {
  const cmpLanguages = cmpResourceLanguages(uiLanguage);
  const bestItemFromKey = new Map<string, ItemT>();

  for (const item of items) {
    const key = accessors.resourceKey(item);
    const bestItem = bestItemFromKey.get(key);
    if (
      bestItem == null ||
      cmpLanguages(accessors.language(item), accessors.language(bestItem)) < 0
    ) {
      bestItemFromKey.set(key, item);
    }
  }

  return Array.from(bestItemFromKey.values());
}
