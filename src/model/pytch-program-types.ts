import * as z from "zod/mini";
import { zStructuredProgram } from "./junior/structured-program/program";

// Zod schemas and types for Pytch programs.

const kPytchProgramKindValue_Flat = "flat" as const;
const kPytchProgramKindValue_PerMethod = "per-method" as const;

export const kPytchProgramKindValues = [
  kPytchProgramKindValue_Flat,
  kPytchProgramKindValue_PerMethod,
];
export const zPytchProgramKind = z.enum(kPytchProgramKindValues);
export type PytchProgramKind = z.infer<typeof zPytchProgramKind>;

const zPytchProgramFlat = z.strictObject({
  kind: z.literal(kPytchProgramKindValue_Flat),
  text: z.string(),
});

const zPytchProgramPerMethod = z.strictObject({
  kind: z.literal(kPytchProgramKindValue_PerMethod),
  program: zStructuredProgram,
});

export const zPytchProgram = z.discriminatedUnion("kind", [
  zPytchProgramFlat,
  zPytchProgramPerMethod,
]);
export type PytchProgram = z.infer<typeof zPytchProgram>;
