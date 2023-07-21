import { PytchProgram } from "../../model/pytch-program";

export function codeTextEnsuringFlat(
  debugLabel: string,
  program: PytchProgram
): string {
  if (program.kind !== "flat") {
    throw new Error(
      `${debugLabel}: Expected program to be "flat"` +
        ` but is "${program.kind}"`
    );
  }
  return program.text;
}
