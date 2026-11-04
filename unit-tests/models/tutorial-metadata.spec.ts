import { assert } from "chai";
import { tutorialMetadataFromJson } from "../../src/model/tutorial-metadata";

describe("Tutorial metadata", () => {
  const validMetadata = {
    programKind: "per-method",
    difficulty: "beginner",
    language: "ga",
    tutorialId: "script-by-script-shoot-the-fruit",
    displayName: "Script-ar-script Buail an t-úll",
  };

  const parse = (obj: object) =>
    tutorialMetadataFromJson(JSON.stringify(obj), "TEST-SOURCE");

  it("accepts valid metadata", () => {
    assert.deepEqual(parse(validMetadata), validMetadata);
  });

  for (const slot of Object.keys(validMetadata)) {
    it(`rejects metadata missing "${slot}"`, () => {
      const metadata: Record<string, unknown> = { ...validMetadata };
      delete metadata[slot];
      assert.throws(() => parse(metadata), /invalid tutorial metadata.*TEST/);
    });
  }

  it("rejects metadata with extra slot", () => {
    const metadata = { ...validMetadata, orderedProjectAssets: [] };
    assert.throws(() => parse(metadata), /orderedProjectAssets/);
  });

  const badValues: Array<[string, unknown]> = [
    ["programKind", "jr"],
    ["difficulty", "easy"],
    ["language", "fr"],
    ["tutorialId", 42],
    ["displayName", null],
  ];
  for (const [slot, value] of badValues) {
    it(`rejects bad "${slot}"`, () => {
      const metadata = { ...validMetadata, [slot]: value };
      assert.throws(() => parse(metadata), /invalid tutorial metadata/);
    });
  }
});
