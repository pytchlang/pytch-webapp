export type SpecimenContentHash = string;

export type LinkedContentRef =
  | { kind: "none" }
  | { kind: "specimen"; specimenContentHash: SpecimenContentHash };

export const LinkedContentRefNone: LinkedContentRef = { kind: "none" };
