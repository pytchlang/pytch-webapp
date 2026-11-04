import { assertNever } from "../utils";
import { TutorialSlugAndMetadata } from "./tutorial-metadata";
import {
  cmpResourceLanguages,
  preferredLanguageVariants,
  ResourceLanguageSelector,
} from "./resource-language";

// Handling of tutorials which exist in more than one language.  Each
// translation is a separate tutorial, with its own slug; translations
// of the same tutorial share a `tutorialId`.

/** Return the given `tutorials`, omitting any with the same
 * `(tutorialId, language)` pair as an earlier one.  The build should
 * prevent such duplicates, but if there are any, warn about each. */
export function withUniqueTutorialLanguages<
  TutorialT extends TutorialSlugAndMetadata,
>(tutorials: Array<TutorialT>): Array<TutorialT> {
  const slugFromKey = new Map<string, string>();
  return tutorials.filter((tutorial) => {
    const { tutorialId, language } = tutorial.metadata;
    const key = JSON.stringify([tutorialId, language]);
    const existingSlug = slugFromKey.get(key);
    if (existingSlug != null) {
      console.warn(
        `tutorials "${existingSlug}" and "${tutorial.slug}" both have` +
          ` tutorialId "${tutorialId}" and language "${language}";` +
          ` ignoring "${tutorial.slug}"`
      );
      return false;
    }
    slugFromKey.set(key, tutorial.slug);
    return true;
  });
}

const kTutorialLanguageAccessors = {
  resourceKey: (t: TutorialSlugAndMetadata) => t.metadata.tutorialId,
  language: (t: TutorialSlugAndMetadata) => t.metadata.language,
};

/** Return the tutorials to display, given all `tutorials`, the current
 * UI language `uiLanguage`, and the user's `languageSelector`.  Show
 * one translation of each tutorial, in the most preferred language
 * (see `preferredLanguageVariants()`).  If `languageSelector` is
 * `"ui-language"`, show only those tutorials which are available in
 * the UI language.  A tutorial's position is that of its first
 * translation in `tutorials`. */
export function displayedTutorials<TutorialT extends TutorialSlugAndMetadata>(
  tutorials: Array<TutorialT>,
  uiLanguage: string,
  languageSelector: ResourceLanguageSelector
): Array<TutorialT> {
  const preferred = preferredLanguageVariants(
    tutorials,
    kTutorialLanguageAccessors,
    uiLanguage
  );
  switch (languageSelector) {
    case "all":
      return preferred;
    case "ui-language":
      return preferred.filter(
        (tutorial) => tutorial.metadata.language === uiLanguage
      );
    default:
      return assertNever(languageSelector);
  }
}

/** Return the other translations of the given `tutorial`, i.e., those
 * of the given `tutorials` which have the same `tutorialId` but a
 * different language, ordered by preference given the current UI
 * language `uiLanguage` (see `cmpResourceLanguages()`). */
export function otherTranslations<TutorialT extends TutorialSlugAndMetadata>(
  tutorials: Array<TutorialT>,
  tutorial: TutorialT,
  uiLanguage: string
): Array<TutorialT> {
  const cmpLanguages = cmpResourceLanguages(uiLanguage);
  return tutorials
    .filter(
      (other) =>
        other.metadata.tutorialId === tutorial.metadata.tutorialId &&
        other.metadata.language !== tutorial.metadata.language
    )
    .sort((a, b) => cmpLanguages(a.metadata.language, b.metadata.language));
}
