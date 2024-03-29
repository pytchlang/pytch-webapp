export type ClipArtGalleryEntryId = number;

export type ClipArtGalleryItem = {
  name: string;
  relativeUrl: string;
  size: [number, number];
  url: string; // Populated when loaded
};

export type ClipArtGalleryEntry = {
  id: ClipArtGalleryEntryId;
  name: string;
  items: Array<ClipArtGalleryItem>;
  tags: Array<string>;
};

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

export const entryMatchesTags = (
  entry: ClipArtGalleryEntry,
  tagSet: Set<string>
): boolean => tagSet.size === 0 || entry.tags.some((tag) => tagSet.has(tag));

/** **Update in place** the `url` properties of all items contained
 * within the given `entries`.  The `url` is computed by prefixing the
 * item's existing `relativeUrl` property with the given
 * `medialibRoot`.*/
export const populateUrlOfItems = (
  entries: Array<ClipArtGalleryEntry>,
  basePath: string
): void => {
  entries.forEach((entry) => {
    entry.items.forEach((item) => {
      item.url = `${basePath}/${item.relativeUrl}`;
    });
  });
};

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
