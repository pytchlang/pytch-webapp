import { assert } from "chai";
import { PytchProgram, PytchProgramOps } from "../../src/model/pytch-program";

describe("PytchProgram operations", () => {
  function assertFlatPython(program: PytchProgram, expCodeText: string) {
    assert.equal(program.kind, "flat");
    assert.equal(program.text, expCodeText);
  }

  const codeText = "import pytch\nprint(42)\n";

  describe("constructors", () => {
    it("fromPythonCode", () => {
      const program = PytchProgramOps.fromPythonCode(codeText);
      assertFlatPython(program, codeText);
    });

    it("fromJson", () => {
      const program = PytchProgramOps.fromJson(
        '{"kind":"flat","text":"# Hello world\\n"}'
      );
      assertFlatPython(program, "# Hello world\n");
    });
  });
});
