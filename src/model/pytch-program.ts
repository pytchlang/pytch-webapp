// To regenerate the JavaScript after updating the schema file
// "pytch-program-schema.json", be in the same directory as
// this file, then run:
//
//   ./refresh-pytch-program-json-validation.sh
//
import _validatePytchProgramJson from "./pytch-program-json-validation";
const validatePytchProgramJson = _validatePytchProgramJson as any;

export type PytchProgram = { kind: "flat"; text: string };

export const PytchProgramOps = {
  /** Return a new `PytchProgram` instance of kind `"flat"` and with the
   * given `text`. */
  fromPythonCode(text: string): PytchProgram {
    return { kind: "flat", text };
  },

  /** Attempt to parse the given `json` string as the JSON
   * representation of a `PytchProgram`, and return the resulting
   * `PytchProgram` if successful.  If not successful, throw an error.
   * */
  fromJson(json: string): PytchProgram {
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
  },
};
