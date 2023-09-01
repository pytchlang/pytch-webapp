import { assertNever, hexSHA256 } from "../utils";
import { flattenProgram } from "./junior/structured-program";
import { StructuredProgram } from "./junior/structured-program/program";

// To regenerate the JavaScript after updating the schema file
// "pytch-program-schema.json", be in the same directory as
// this file, then run:
//
//   ./refresh-pytch-program-json-validation.sh
//
import { validate as _untypedValidate } from "./pytch-program-json-validation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validatePytchProgramJson = _untypedValidate as any;

export type PytchProgram =
  | { kind: "flat"; text: string }
  | { kind: "per-method"; program: StructuredProgram };

export type FlattenedPythonProgram = {
  code: string;
};

export type PytchProgramOfKind<KindT extends PytchProgram["kind"]> =
  PytchProgram & { kind: KindT };

export class PytchProgramOps {
  /** Return a new `PytchProgram` instance of kind `"flat"` and with the
   * given `text`. */
  static fromPythonCode(text: string): PytchProgram {
    return { kind: "flat", text };
  }

  /** Return a new `PytchProgram` instance of kind `"per-method"` and
   * with the given structured `program`. */
  static fromStructuredProgram(program: StructuredProgram): PytchProgram {
    return { kind: "per-method", program };
  }

  /** Return a flat-text Python equivalent of the given `program`. */
  static flatCodeText(program: PytchProgram): FlattenedPythonProgram {
    switch (program.kind) {
      case "flat":
        return { code: program.text };
      case "per-method": {
        // TODO: Assets.
        const flattenResults = flattenProgram(program.program, []);
        // TODO: Do something with flattenResults.mapEntries.
        return { code: flattenResults.codeText };
      }
      default:
        return assertNever(program);
    }
  }

  /** Attempt to parse the given `json` string as the JSON
   * representation of a `PytchProgram`, and return the resulting
   * `PytchProgram` if successful.  If not successful, throw an error.
   * */
  static fromJson(json: string): PytchProgram {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: any = null;
    try {
      obj = JSON.parse(json);
    } catch {
      throw new Error("malformed JSON for PytchProgram");
    }

    if (!validatePytchProgramJson(obj)) {
      throw new Error("invalid JSON for PytchProgram");
    }

    return obj;
  }

  static async fingerprint(program: PytchProgram): Promise<string> {
    switch (program.kind) {
      case "flat": {
        const contentHash = await hexSHA256(program.text);
        return `program=flat/${contentHash}`;
      }
      default:
        return assertNever(program);
    }
  }

  static ensureKind<KindT extends PytchProgram["kind"]>(
    label: string,
    program: PytchProgram,
    requiredKind: KindT
  ): PytchProgramOfKind<KindT> {
    const actualKind = program.kind;
    if (actualKind !== requiredKind)
      throw new Error(
        label +
          `: program should be of kind "${requiredKind}"` +
          ` but is of kind "${actualKind}"`
      );
    return program as PytchProgramOfKind<KindT>;
  }
}
