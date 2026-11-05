import { TutorialSlugAndMetadata } from "./tutorial-metadata";

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
