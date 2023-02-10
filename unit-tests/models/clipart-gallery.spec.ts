import { assert } from "chai";
import {
  ClipArtGalleryEntry,
  ClipArtGalleryItem,
  entryMatchesTags,
  nSelectedItemsInEntries,
  unionAllTags,
  selectedEntries,
  populateUrlOfItems,
} from "../../src/model/clipart-gallery-core";

const getId = (() => {
  let nextId = 10000;
  return () => ++nextId;
})();

const mkEntry = (
  name: string,
  items: Array<ClipArtGalleryItem>,
  tags: Array<string>
): ClipArtGalleryEntry => ({
  id: getId(),
  name,
  items,
  tags,
});

const mkItem = (name: string): ClipArtGalleryItem => ({
  name,
  relativeUrl: `./${name}`,
  size: [100, 80],
  url: `/some/path/to/${name}`,
});

const mkSingleton = (
  basename: string,
  tags: Array<string>
): ClipArtGalleryEntry => mkEntry(basename, [mkItem(`${basename}.jpg`)], tags);

const mkFarmEntry = () =>
  mkEntry(
    "Farm animals",
    [mkItem("cow.jpg"), mkItem("sheep.jpg")],
    ["farm", "animal"]
  );

const farmEntry = mkFarmEntry();

const bananaEntry = mkSingleton("banana", ["fruit", "yellow"]);

const entries: Array<ClipArtGalleryEntry> = [
  bananaEntry,
  mkSingleton("apple.jpg", ["fruit", "green"]),
  mkSingleton("turtle.jpg", ["animal", "green"]),
  farmEntry,
];

const allEntryIds = entries.map((e) => e.id);

describe("Clip art gallery", () => {
  describe("unionAllTags", () => {
    it("works", () => {
      assert.deepEqual(unionAllTags(entries), [
        "animal",
        "farm",
        "fruit",
        "green",
        "yellow",
      ]);
    });
  });

  describe("entryMatchesTags", () => {
    const emptyTagSet = new Set<string>();
    it("empty tag-set", () => {
      assert.isTrue(entries.every((e) => entryMatchesTags(e, emptyTagSet)));
    });

    const mkTags = (...tags: Array<string>) => new Set<string>(tags);

    it("singleton group, selective tag-set", () => {
      assert.isTrue(entryMatchesTags(entries[0], mkTags("fruit")));
      assert.isTrue(entryMatchesTags(entries[0], mkTags("yellow")));
      assert.isFalse(entryMatchesTags(entries[0], mkTags("orange")));
    });

    it("proper group, selective tag-set", () => {
      assert.isTrue(entryMatchesTags(farmEntry, mkTags("farm", "fruit")));
      assert.isTrue(entryMatchesTags(farmEntry, mkTags("animal")));
      assert.isFalse(entryMatchesTags(farmEntry, mkTags("yellow")));
      assert.isFalse(entryMatchesTags(farmEntry, mkTags("fruit")));
    });
  });

  describe("nSelectedItemsInEntries", () => {
    const nSelected = (ids: Array<number>) =>
      nSelectedItemsInEntries(entries, ids);

    it("nothing selected", () => {
      assert.equal(nSelected([]), 0);
    });
    it("one id selected", () => {
      assert.equal(nSelected([entries[0].id]), 1);
    });
    it("all ids selected", () => {
      assert.equal(nSelected(allEntryIds), 5);
    });
  });

  describe("selectedEntries", () => {
    it("none selected", () => {
      assert.deepEqual(selectedEntries(entries, []), []);
    });
    it("some selected", () => {
      assert.deepEqual(selectedEntries(entries, [farmEntry.id]), [farmEntry]);
    });
    it("all selected", () => {
      assert.equal(selectedEntries(entries, allEntryIds).length, 4);
    });
  });

  describe("populateUrlOfItems", () => {
    it("works", () => {
      let entry = mkFarmEntry();
      populateUrlOfItems([entry], "base-path/foo");
      assert.equal(entry.items[0].url, "base-path/foo/./cow.jpg");
      assert.equal(entry.items[1].url, "base-path/foo/./sheep.jpg");
    });
  });
});
