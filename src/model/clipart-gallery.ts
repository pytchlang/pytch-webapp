import { Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { assertNever } from "../utils";
import { envVarOrFail } from "../env-utils";
import {
  ContentFetchState,
  ExternalJsonSlice,
  externalJsonSlice,
} from "./external-json-data";

import {
  ClipArtGalleryData,
  unionAllTags,
  nSelectedItemsInEntries,
  ClipArtGalleryEntryId,
  ClipArtGalleryEntry,
  selectedEntries,
  zClipArtGalleryEntryArray,
} from "./clipart-gallery-core";

const medialibRoot = () => envVarOrFail("VITE_MEDIALIB_BASE");

export const resolveMedialibUrl = (relativeUrl: string): string =>
  `${medialibRoot()}/${relativeUrl}`;

const galleryDataFromRawObj = (rawObj: unknown): ClipArtGalleryData => {
  const entries = zClipArtGalleryEntryArray.parse(rawObj);
  const tags = unionAllTags(entries);
  return { entries, tags };
};

type FetchState = ContentFetchState<ClipArtGalleryData>;

export const nSelectedItemsInGallery = (
  fetchState: FetchState,
  selectedIds: Array<ClipArtGalleryEntryId>
): number => {
  switch (fetchState.state) {
    case "idle":
    case "requesting":
    case "error":
      return 0;
    case "available":
      return nSelectedItemsInEntries(fetchState.content.entries, selectedIds);
    default:
      return assertNever(fetchState);
  }
};

const selectedEntriesInGallery = (
  fetchState: FetchState,
  selectedIds: Array<ClipArtGalleryEntryId>
): Array<ClipArtGalleryEntry> => {
  switch (fetchState.state) {
    case "idle":
    case "requesting":
    case "error":
      console.warn(`unexpected gallery fetch-state ${fetchState.state}`);
      return [];
    case "available": {
      const allEntries = fetchState.content.entries;
      return selectedEntries(allEntries, selectedIds);
    }
    default:
      return assertNever(fetchState);
  }
};

export interface IClipArtGallery {
  gallery: ExternalJsonSlice<ClipArtGalleryData>;

  selectedEntries: Thunk<
    IClipArtGallery,
    Array<ClipArtGalleryEntryId>,
    void,
    IPytchAppModel,
    Array<ClipArtGalleryEntry>
  >;
}

export const clipArtGallery: IClipArtGallery = {
  gallery: externalJsonSlice(
    () => `${medialibRoot()}/index.json`,
    galleryDataFromRawObj
  ),

  selectedEntries: thunk((_actions, selectedIds, helpers) => {
    const fetchState = helpers.getState().gallery.contentFetchState;
    return selectedEntriesInGallery(fetchState, selectedIds);
  }),
};
