import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { assertNever } from "../utils";
import { envVarOrFail } from "../env-utils";
import { mkRawSpec, RawOrI18nStringSpec } from "./i18n/core-types";

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
  state: ClipArtGalleryState;
  setState: Action<IClipArtGallery, ClipArtGalleryState>;

  startFetchIfRequired: Thunk<IClipArtGallery, void, void, IPytchAppModel>;
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
  state: { status: "fetch-not-started" },
  setState: action((state, innerState) => {
    state.state = innerState;
  }),

  // Core work is in startFetchIfRequired().
  startFetchIfRequired: thunk(async (actions, _voidPayload, helpers) => {
    const medialibRoot = envVarOrFail("VITE_MEDIALIB_BASE");

    const state = helpers.getState().state;
    if (state.status !== "fetch-not-started") return;

    actions.setState({ status: "fetch-pending" });

    try {
      const indexUrl = `${medialibRoot}/index.json`;
      const resp = await fetch(indexUrl);

      let entries = await resp.json();
      populateUrlOfItems(entries, medialibRoot);

      const tags: Array<string> = unionAllTags(entries);

      actions.setState({ status: "ready", entries, tags });
    } catch (e) {
      console.error("failed to fetch media library", e);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maybeErrorMessage: string | undefined = (e as any).message;
      const messageSpec: RawOrI18nStringSpec =
        maybeErrorMessage != null
          ? mkRawSpec(maybeErrorMessage)
          : kFetchErrorSpec;

      actions.setState({ status: "fetch-failed", messageSpec });
    }
  }),

  selectedEntries: thunk((_actions, selectedIds, helpers) => {
    return selectedEntriesInGallery(helpers.getState().state, selectedIds);
  }),
};
