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

  it("flatCodeText", () => {
    const program = PytchProgramOps.fromPythonCode(codeText);
    const gotCodeText = PytchProgramOps.flatCodeText(program);
    assert.equal(gotCodeText, codeText);
  });

  describe("validation", () => {
    const specs = [
      {
        label: "empty string",
        text: "",
        expMessage: "malformed JSON",
      },
      {
        label: "nonsense",
        text: "f/(asdf]",
        expMessage: "malformed JSON",
      },
      {
        label: "array",
        text: "[1,2,3]",
        expMessage: "invalid JSON",
      },
      {
        label: "no kind",
        text: '{"hello":"world"}',
        expMessage: "invalid JSON",
      },
      {
        label: "numeric kind",
        text: '{"kind":42}',
        expMessage: "invalid JSON",
      },
      {
        label: "bad string kind",
        text: '{"kind":"bananas"}',
        expMessage: "invalid JSON",
      },
      {
        label: 'kind "flat" missing text',
        text: '{"kind":"flat"}',
        expMessage: "invalid JSON",
      },
      {
        label: 'kind "flat" numeric text',
        text: '{"kind":"flat","text":42}',
        expMessage: "invalid JSON",
      },
      {
        label: 'kind "flat" array text',
        text: '{"kind":"flat","text":[1,2,3]}',
        expMessage: "invalid JSON",
      },
    ];

    specs.forEach((spec) =>
      it(`rejects ${spec.label}`, () => {
        assert.throws(
          () => PytchProgramOps.fromJson(spec.text),
          spec.expMessage
        );
      })
    );
  });
});
