import { assertNever } from "../utils";
import { LinkedJrTutorialRef } from "./junior/jr-tutorial";
import { ProjectId } from "./project-core";

export type SpecimenContentHash = string;

export type LinkedContentRef =
  | { kind: "none" }
  | LinkedJrTutorialRef
  | { kind: "specimen"; specimenContentHash: SpecimenContentHash };

export const LinkedContentRefNone: LinkedContentRef = { kind: "none" };

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
    default:
      return assertNever(ref1);
  }
}
