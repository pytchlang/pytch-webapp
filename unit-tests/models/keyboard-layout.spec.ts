import { assert } from "chai";
import { keyInLayoutLocator } from "../../src/model/junior/keyboard-layout";

describe("Key location look-up", () => {
  [
    { key: "4", expRow: 0, expCol: 3, expFlat: 3 },
    { key: "1", expRow: 0, expCol: 0, expFlat: 0 },
    { key: "l", expRow: 2, expCol: 8, expFlat: 28 },
    { key: " ", expRow: 4, expCol: 0, expFlat: 36 },
  ].forEach((spec) =>
    it(`finds key "${spec.key}"`, () => {
      const loc = keyInLayoutLocator(spec.key);
      assert.equal(loc.rowIdx, spec.expRow);
      assert.equal(loc.colIdx, spec.expCol);
      assert.equal(loc.flatIdx, spec.expFlat);
    })
  );

  ["", "A", "blah"].forEach((badKey) =>
    it(`gives error for "${badKey}"`, () => {
      assert.throws(() => keyInLayoutLocator(badKey), /key.*not found/);
    })
  );
});
