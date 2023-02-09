import { assert } from "chai";
import {
  ClipArtGalleryEntry,
  ClipArtGalleryItem,
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

const farmEntry = mkEntry(
  "Farm animals",
  [mkItem("cow.jpg"), mkItem("sheep.jpg")],
  ["farm", "animal"]
);

const bananaEntry = mkSingleton("banana", ["fruit", "yellow"]);

const entries: Array<ClipArtGalleryEntry> = [
  bananaEntry,
  mkSingleton("apple.jpg", ["fruit", "green"]),
  mkSingleton("turtle.jpg", ["animal", "green"]),
  farmEntry,
];

const allEntryIds = entries.map((e) => e.id);
