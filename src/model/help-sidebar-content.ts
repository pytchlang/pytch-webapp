import * as z from "zod/mini";
import { zEventDescriptor } from "./junior/structured-program/event";
import { zActorKind } from "./junior/structured-program/actor";

// Zod schemas describing the raw JSON stored in
// `public/data/help-sidebar.json`, which is fetched and converted into
// an `HelpContent` instance by `groupHelpIntoSections()` in
// `help-sidebar.ts`.

/** The JSON file is one flat array of entries.  The logical structure
 * is represented by the presence of `heading` entries.  Non-heading
 * entries following a heading entry belong to the section described by
 * the previous `heading`, until the next `heading`.
 *
 * Within a section, there are a few kinds of content entry:
 *
 * * `block` — a direct mapping between a Scratch block and a Python
 *   expression or statement, such as a method call.
 * * `non-method-block` — a direct mapping between a Scratch block and
 *   some Python syntax other than a simple statement.
 * * `pure-python` — a piece of Python method call which has no Scratch
 *   equivalent.
 *
 * (The label fragment `non-method` is poorly chosen, sorry.)
 *
 * The discrimination between "flat", "per-method" and/or
 * "per-method/sprite" and "per-method/stage" is usually only minor
 * wording changes, or to address the wrinkle that "flat" programs need
 * just the *stem* of a costume's basename but "per-method" programs use
 * the full basename.
 * */

/** Marker that the following entries belong to this section, until the
 * next `heading` entry. */
const zHeadingEntry = z.strictObject({
  kind: z.literal("heading"),
  sectionSlug: z.string(),
  heading: z.string(),
});
export type HelpSidebarHeadingEntry = z.infer<typeof zHeadingEntry>;

/** Help text for one entry: universal; by program-kind; or by
 * actor-kind within per-method.
 */
export const zHelpEntryContent = z.union([
  z.string(), // universal, or...
  // specific to each program-kind:
  z.strictObject({
    flat: z.string(),
    "per-method": z.union([
      z.string(), // for both sprite and stage, or...
      // specific to each actor-kind:
      z.strictObject({
        sprite: z.string(),
        stage: z.string(),
      }),
    ]),
  }),
]);
export type HelpEntryContent = z.infer<typeof zHelpEntryContent>;

/** Python code for a `pure-python` entry, which can be universal; or
 * given for each program-kind separately. */
export const zHelpPythonCode = z.union([
  z.string(), // universal, or...
  // specific to each program-kind:
  z.strictObject({
    flat: z.string(),
    "per-method": z.string(),
  }),
]);
export type HelpPythonCode = z.infer<typeof zHelpPythonCode>;

/** Correspondence between a Scratch block and an Actor method. */
const zBlockEntry = z.strictObject({
  kind: z.literal("block"),
  actorKind: z.optional(zActorKind), // missing = "both actor kinds"
  python: z.string(),
  scratch: z.string(),
  scratchIsLong: z.optional(z.boolean()), // missing = false
  eventDescriptor: z.optional(zEventDescriptor), // for hat-blocks
  help: zHelpEntryContent,
});
export type HelpSidebarBlockEntry = z.infer<typeof zBlockEntry>;

/** Correspondence between a Scratch block and some Python syntax. E.g.,
 * "while" or "if".  The `python` is absent for the mathematical
 * functions entry. */
const zNonMethodBlockEntry = z.strictObject({
  kind: z.literal("non-method-block"),
  heading: z.string(),
  scratch: z.string(),
  python: z.optional(z.string()),
  help: zHelpEntryContent,
});
export type HelpSidebarNonMethodBlockEntry = z.infer<
  typeof zNonMethodBlockEntry
>;

/** Entry which does not correspond to any Scratch block. */
const zPurePythonEntry = z.strictObject({
  kind: z.literal("pure-python"),
  python: zHelpPythonCode,
  help: zHelpEntryContent,
});
export type HelpSidebarPurePythonEntry = z.infer<typeof zPurePythonEntry>;

export const zHelpSidebarEntry = z.discriminatedUnion("kind", [
  zHeadingEntry,
  zBlockEntry,
  zNonMethodBlockEntry,
  zPurePythonEntry,
]);
export type HelpSidebarEntry = z.infer<typeof zHelpSidebarEntry>;
export type HelpSidebarContentEntry = Exclude<
  HelpSidebarEntry,
  { kind: "heading" }
>;

export const zHelpSidebarContent = z.array(zHelpSidebarEntry);
export type HelpSidebarContent = z.infer<typeof zHelpSidebarContent>;
