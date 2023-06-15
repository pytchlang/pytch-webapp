export type PytchProgram = { kind: "flat"; text: string };

export const PytchProgramOps = {
  /** Return a new `PytchProgram` instance of kind `"flat"` and with the
   * given `text`. */
  fromPythonCode(text: string): PytchProgram {
    return { kind: "flat", text };
  },
};
