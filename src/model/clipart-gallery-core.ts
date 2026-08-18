import * as z from "zod/mini";

const zClipArtGalleryEntryId = z.number();
export type ClipArtGalleryEntryId = z.infer<typeof zClipArtGalleryEntryId>;

const zClipArtGalleryItem = z.strictObject({
  name: z.string(),
  relativeUrl: z.string(),
  size: z.array(z.number()).check(z.length(2)),
});

const zClipArtGalleryEntry = z.strictObject({
  id: zClipArtGalleryEntryId,
  name: z.string(),
  items: z.array(zClipArtGalleryItem),
  tags: z.array(z.string()),
});
export type ClipArtGalleryEntry = z.infer<typeof zClipArtGalleryEntry>;

export type ClipArtGalleryData = {
  entries: Array<ClipArtGalleryEntry>;
  tags: Array<string>;
};

export const unionAllTags = (
  entries: Array<ClipArtGalleryEntry>
): Array<string> => {
  let tags = new Set<string>();
  entries.forEach((entry) => {
    entry.tags.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags.values()).sort();
};

export const entryMatchesTag = (
  entry: ClipArtGalleryEntry,
  tag: string | null
): boolean => tag == null || entry.tags.indexOf(tag) !== -1;

export const selectedEntries = (
  entries: Array<ClipArtGalleryEntry>,
  selectedIds: Array<ClipArtGalleryEntryId>
) => {
  const idsSet = new Set(selectedIds);
  return entries.filter((entry) => idsSet.has(entry.id));
};

export const nSelectedItemsInEntries = (
  entries: Array<ClipArtGalleryEntry>,
  selectedIds: Array<ClipArtGalleryEntryId>
): number => {
  return selectedEntries(entries, selectedIds)
    .map((entry) => entry.items.length)
    .reduce((x, y) => x + y, 0);
};
