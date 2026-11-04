import { assert } from "chai";
import {
  cmpResourceLanguages,
  preferredLanguageVariants,
} from "../../src/model/resource-language";

describe("Resource language preference", () => {
  it("orders languages by preference", () => {
    const sorted = (uiLanguage: string) =>
      ["de", "xx", "ga", "en", "aa"].sort(cmpResourceLanguages(uiLanguage));

    assert.deepEqual(sorted("en"), ["en", "ga", "de", "aa", "xx"]);
    assert.deepEqual(sorted("ga"), ["ga", "en", "de", "aa", "xx"]);
    assert.deepEqual(sorted("de"), ["de", "en", "ga", "aa", "xx"]);
    assert.deepEqual(sorted("xx"), ["xx", "en", "ga", "de", "aa"]);
  });

  type Item = { key: string; language: string };
  const items: Array<Item> = [
    { key: "a", language: "en" },
    { key: "b", language: "ga" },
    { key: "a", language: "ga" },
    { key: "c", language: "de" },
    { key: "b", language: "en" },
    { key: "a", language: "de" },
  ];

  const accessors = {
    resourceKey: (item: Item) => item.key,
    language: (item: Item) => item.language,
  };
  const variants = (uiLanguage: string) =>
    preferredLanguageVariants(items, accessors, uiLanguage).map(
      (item) => `${item.key}/${item.language}`
    );

  it("chooses most-preferred variant, in first-appearance order", () => {
    assert.deepEqual(variants("en"), ["a/en", "b/en", "c/de"]);
    assert.deepEqual(variants("ga"), ["a/ga", "b/ga", "c/de"]);
    assert.deepEqual(variants("de"), ["a/de", "b/en", "c/de"]);
  });
});
