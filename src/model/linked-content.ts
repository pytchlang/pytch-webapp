import { assertNever } from "../utils";

export type SpecimenContentHash = string;

export type LinkedContentRef =
  | { kind: "none" }
  | { kind: "specimen"; specimenContentHash: SpecimenContentHash };

export const LinkedContentRefNone: LinkedContentRef = { kind: "none" };

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
    case "specimen":
      return (
        ref2.kind === "specimen" &&
        ref1.specimenContentHash === ref2.specimenContentHash
      );
    default:
      return assertNever(ref1);
  }
}
