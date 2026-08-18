import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { assertNever } from "../utils";
import { envVarOrFail } from "../env-utils";
import { mkRawSpec, RawOrI18nStringSpec } from "./i18n/core-types";
import {
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

export const nSelectedItemsInGallery = (
  galleryState: ClipArtGalleryState,
  selectedIds: Array<ClipArtGalleryEntryId>
): number => {
  switch (galleryState.status) {
    case "fetch-failed":
    case "fetch-not-started":
    case "fetch-pending":
      return 0;
    case "ready":
      return nSelectedItemsInEntries(galleryState.entries, selectedIds);
    default:
      return assertNever(galleryState);
  }
};

const selectedEntriesInGallery = (
  galleryState: ClipArtGalleryState,
  selectedIds: Array<ClipArtGalleryEntryId>
): Array<ClipArtGalleryEntry> => {
  switch (galleryState.status) {
    case "fetch-failed":
    case "fetch-not-started":
    case "fetch-pending":
      // This function should never be called unless we're "ready".
      console.warn(`unexpected gallery state ${galleryState.status}`);
      return [];
    case "ready": {
      const allEntries = galleryState.entries;
      return selectedEntries(allEntries, selectedIds);
    }
    default:
      return assertNever(galleryState);
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
