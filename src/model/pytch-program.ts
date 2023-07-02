import { assertNever, hexSHA256 } from "../utils";

// To regenerate the JavaScript after updating the schema file
// "pytch-program-schema.json", be in the same directory as
// this file, then run:
//
//   ./refresh-pytch-program-json-validation.sh
//
import { validate as _untypedValidate } from "./pytch-program-json-validation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validatePytchProgramJson = _untypedValidate as any;

export type PytchProgram = { kind: "flat"; text: string };

export type PytchProgramOfKind<
  KindT extends PytchProgram["kind"]
> = PytchProgram & { kind: KindT };

export class PytchProgramOps {
  /** Return a new `PytchProgram` instance of kind `"flat"` and with the
   * given `text`. */
  static fromPythonCode(text: string): PytchProgram {
    return { kind: "flat", text };
  }

  /** Return a flat-text Python equivalent of the given `program`. */
  static flatCodeText(program: PytchProgram) {
    switch (program.kind) {
      case "flat":
        return program.text;
      default:
        return assertNever(program as never);
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
        return assertNever(program as never);
    }
  }
}
