import { assert } from "chai";
import { readdirSync } from "fs";
import { join as joinPath } from "path";

import { kLanguagePreferenceOrder } from "../../src/model/languages";

describe("Supported languages", () => {
  it("have translations, and only they do", () => {
    const i18nRoot = joinPath(
      __dirname,
      "..",
      "..",
      "src",
      "data",
      "i18n-by-ns"
    );
    const translatedLanguages = readdirSync(i18nRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    assert.deepEqual(translatedLanguages, [...kLanguagePreferenceOrder].sort());
  });
});
