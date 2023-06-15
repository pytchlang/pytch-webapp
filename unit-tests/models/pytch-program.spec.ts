import { assert } from "chai";
import { PytchProgram, PytchProgramOps } from "../../src/model/pytch-program";

describe("PytchProgram operations", () => {
  function assertFlatPython(program: PytchProgram, expCodeText: string) {
    assert.equal(program.kind, "flat");
    assert.equal(program.text, expCodeText);
  }

  const codeText = "import pytch\nprint(42)\n";
});
