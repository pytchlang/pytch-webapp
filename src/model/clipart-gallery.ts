import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { assertNever } from "../utils";
import { envVarOrFail } from "../env-utils";
import { mkRawSpec, RawOrI18nStringSpec } from "./i18n/core-types";
import {
  ContentFetchState,
  ExternalJsonSlice,
  externalJsonSlice,
} from "./external-json-data";

import {
  ClipArtGalleryData,
  unionAllTags,
  populateUrlOfItems,
  nSelectedItemsInEntries,
  ClipArtGalleryEntryId,
  ClipArtGalleryEntry,
  selectedEntries,
} from "./clipart-gallery-core";

export type ClipArtGalleryState =
  | { status: "fetch-not-started" }
  | { status: "fetch-pending" }
  | { status: "fetch-failed"; messageSpec: RawOrI18nStringSpec }
  | ({ status: "ready" } & ClipArtGalleryData);

const medialibRoot = () => envVarOrFail("VITE_MEDIALIB_BASE");

const galleryDataFromRawObj = (rawObj: unknown): ClipArtGalleryData => {
  const entries = rawObj as Array<ClipArtGalleryEntry>;
  populateUrlOfItems(entries, medialibRoot());
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

const kFetchErrorSpec: RawOrI18nStringSpec = {
  kind: "i18n",
  spec: { ns: "assets", keyPart: "add.media-library.fetch-error" },
};

export const clipArtGallery: IClipArtGallery = {
  gallery: externalJsonSlice(
    () => `${medialibRoot()}/index.json`,
    galleryDataFromRawObj
  ),

  selectedEntries: thunk((_actions, selectedIds, helpers) => {
    return selectedEntriesInGallery(helpers.getState().state, selectedIds);
  }),
};
