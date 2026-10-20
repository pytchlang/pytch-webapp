import { assertNever } from "../utils";
import { zLinkedJrTutorialRef } from "./junior/jr-tutorial";
import { ProjectId } from "./project-core";
import * as z from "zod/mini";

export type SpecimenContentHash = string;

const zLinkedNoContentRef = z.object({
  kind: z.literal("none"),
});
export type LinkedNoContentRef = z.infer<typeof zLinkedNoContentRef>;

const zLinkedSpecimenRef = z.object({
  kind: z.literal("specimen"),
  specimenContentHash: z.string(),
});
export type LinkedSpecimenRef = z.infer<typeof zLinkedSpecimenRef>;

// Projects created before demos had a language were all created from
// the "en" version of the demo.
const zLinkedDemoRef = z.object({
  kind: z.literal("demo"),
  uuid: z.string(),
  language: z._default(z.string(), "en"),
});
export type LinkedDemoRef = z.infer<typeof zLinkedDemoRef>;

export const zLinkedContentRef = z.discriminatedUnion("kind", [
  zLinkedNoContentRef,
  zLinkedJrTutorialRef,
  zLinkedSpecimenRef,
  zLinkedDemoRef,
]);

export type LinkedContentRef = z.infer<typeof zLinkedContentRef>;

type LinkedContentRefKind = LinkedContentRef["kind"];

export type LinkedContentRefOfKind<KindT extends LinkedContentRefKind> =
  LinkedContentRef & { kind: KindT };

export const kLinkedContentRefNone: LinkedContentRef = { kind: "none" };

export type LinkedContentRefUpdate = {
  projectId: ProjectId;
  contentRef: LinkedContentRef;
};

export function eqLinkedContentRefs(
  ref1: LinkedContentRef,
  ref2: LinkedContentRef
): boolean {
  // Might have been cleaner to reject ref1.kind !== ref2.kind up front,
  // but TypeScript doesn't seem to propagate type constrints inferred
  // on ref1 to ref2.

  switch (ref1.kind) {
    case "none":
      return ref2.kind === "none";
    case "jr-tutorial":
      return ref2.kind === "jr-tutorial" && ref1.name === ref2.name;
    case "specimen":
      return (
        ref2.kind === "specimen" &&
        ref1.specimenContentHash === ref2.specimenContentHash
      );
    case "demo":
      return (
        ref2.kind === "demo" &&
        ref1.uuid === ref2.uuid &&
        ref1.language === ref2.language
      );
    default:
      return assertNever(ref1);
  }
}
