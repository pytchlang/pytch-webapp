import { assert } from "chai";
import { PytchProgram, PytchProgramOps } from "../../src/model/pytch-program";
import { hexSHA256 } from "../../src/utils";
import { StructuredProgramOps } from "../../src/model/junior/structured-program";

describe("PytchProgram operations", () => {
  function assertFlatPython(program: PytchProgram, expCodeText: string) {
    const flatProgram = PytchProgramOps.ensureKind(
      "assertFlatPython()",
      program,
      "flat"
    );
    assert.equal(flatProgram.text, expCodeText);
  }

  const codeText = "import pytch\nprint(42)\n";

  describe("constructors", () => {
    it("newEmpty", () => {
      const flatProgram = PytchProgramOps.newEmpty("flat");
      assertFlatPython(flatProgram, "import pytch\n\n");

      const perMethodProgram = PytchProgramOps.newEmpty("per-method");
      assert.equal(perMethodProgram.program.actors.length, 1);
      assert.equal(perMethodProgram.program.actors[0].name, "Stage");
    });

    it("fromPythonCode", () => {
      const program = PytchProgramOps.fromPythonCode(codeText);
      assertFlatPython(program, codeText);
    });

    it("fromStructuredProgram", () => {
      const structuredProgram = StructuredProgramOps.newEmpty();
      const program = PytchProgramOps.fromStructuredProgram(structuredProgram);
      const structuredProgramRoundTrip = PytchProgramOps.ensureKind(
        "unitTest()",
        program,
        "per-method"
      ).program;
      assert.deepEqual(structuredProgramRoundTrip, structuredProgram);
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
    const gotCodeText = PytchProgramOps.flatCodeText(program, []).codeText;
    assert.equal(gotCodeText, codeText);
    // TODO: Test per-method case.
  });

  it("ensureKind", () => {
    const flatProgram = PytchProgramOps.fromPythonCode(codeText);
    assert.strictEqual(
      flatProgram,
      PytchProgramOps.ensureKind("unitTest()", flatProgram, "flat")
    );

    assert.throws(
      () => PytchProgramOps.ensureKind("unitTest()", flatProgram, "per-method"),
      "should be of kind"
    );
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

  it("fingerprint()", async () => {
    // The following string contains one o-umlaut and one plain o
    // followed by combining-diaeresis.  However both get normalised to
    // the pre-combined form; see bytes below.
    const nonAsciiCodeText = 'import pytch\nprint("Hellö wörld")\n';
    const program = PytchProgramOps.fromPythonCode(nonAsciiCodeText);
    const gotFingerprint = await PytchProgramOps.fingerprint(program);

    const expBytes = [
      0x69, 0x6d, 0x70, 0x6f, 0x72, 0x74, 0x20, 0x70, 0x79, 0x74, 0x63, 0x68,
      0x0a, 0x70, 0x72, 0x69, 0x6e, 0x74, 0x28, 0x22, 0x48, 0x65, 0x6c, 0x6c,
      0xc3, 0xb6, 0x20, 0x77, 0xc3, 0xb6, 0x72, 0x6c, 0x64, 0x22, 0x29, 0x0a,
    ];
    const expHash = await hexSHA256(new Uint8Array(expBytes));
    const expFingerprint = `program=flat/${expHash}`;

    assert.equal(gotFingerprint, expFingerprint);
  });
});
