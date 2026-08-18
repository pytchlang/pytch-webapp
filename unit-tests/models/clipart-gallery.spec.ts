import { assert } from "chai";
import {
  ClipArtGalleryEntry,
  ClipArtGalleryItem,
  entryMatchesTag,
  nSelectedItemsInEntries,
  unionAllTags,
  selectedEntries,
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

  describe("entryMatchesTag", () => {
    it("no filter tag", () => {
      assert.isTrue(entries.every((e) => entryMatchesTag(e, null)));
    });

    it("singleton group, filter tag", () => {
      assert.isTrue(entryMatchesTag(entries[0], "fruit"));
      assert.isTrue(entryMatchesTag(entries[0], "yellow"));
      assert.isFalse(entryMatchesTag(entries[0], "orange"));
    });

    it("proper group, filter tag", () => {
      assert.isTrue(entryMatchesTag(farmEntry, "farm"));
      assert.isTrue(entryMatchesTag(farmEntry, "animal"));
      assert.isFalse(entryMatchesTag(farmEntry, "yellow"));
      assert.isFalse(entryMatchesTag(farmEntry, "fruit"));
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
});
