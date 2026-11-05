import * as z from "zod/mini";
import { zPytchProgramKind } from "./pytch-program-types";

// Languages in which a tutorial can be written.  Keep in sync by hand
// with: KNOWN_TUTORIAL_LANGUAGES in pytch-build's "tutorial_history.py";
// `supportedLanguages` in "i18n.ts"; and
// `kResourceLanguagePreferenceOrder` in "resource-language.ts".
export const zTutorialLanguage = z.enum(["en", "de", "ga"]);
export type TutorialLanguage = z.infer<typeof zTutorialLanguage>;

export const zTutorialDifficulty = z.enum([
  "getting-started",
  "beginner",
  "medium",
  "advanced",
]);
export type TutorialDifficulty = z.infer<typeof zTutorialDifficulty>;

// The metadata of a tutorial, as emitted by pytch-build (as the
// "data-metadata-json" attribute of the tutorial and summary divs).
// The build fills in all defaults, so all slots are required.
//
// This schema is strict, so adding a slot is a two-step change: first
// deploy a front end which accepts the new slot (as optional), then
// deploy tutorials built to emit it.  The opposite order would make
// cached front-end bundles reject the tutorial index.  See
// EMITTED_METADATA_SLOTS in pytch-build's "tutorial_history.py".
export const zTutorialMetadata = z.strictObject({
  programKind: zPytchProgramKind,
  difficulty: zTutorialDifficulty,
  language: zTutorialLanguage,
  tutorialId: z.string(),
  displayName: z.string(),
});
export type TutorialMetadata = z.infer<typeof zTutorialMetadata>;
