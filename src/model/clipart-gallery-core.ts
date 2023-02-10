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
