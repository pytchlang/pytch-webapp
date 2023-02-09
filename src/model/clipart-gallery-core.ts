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
