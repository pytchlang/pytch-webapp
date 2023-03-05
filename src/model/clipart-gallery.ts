import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { assertNever, failIfNull } from "../utils";

import {
  ClipArtGalleryData,
  unionAllTags,
  populateUrlOfItems,
  nSelectedItemsInEntries,
} from "./clipart-gallery-core";

const medialibRoot = failIfNull(
  process.env.REACT_APP_MEDIALIB_BASE,
  "must set REACT_APP_MEDIALIB_BASE env.var"
);

export type ClipArtGalleryState =
  | { status: "fetch-not-started" }
  | { status: "fetch-pending" }
  | { status: "fetch-failed"; message: string }
  | ({ status: "ready" } & ClipArtGalleryData);

export const nSelectedItemsInGallery = (
  galleryState: ClipArtGalleryState,
  selectedIds: Array<number>
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

export interface IClipArtGallery {
  state: ClipArtGalleryState;
  setState: Action<IClipArtGallery, ClipArtGalleryState>;

  startFetchIfRequired: Thunk<IClipArtGallery, void, any, IPytchAppModel>;
}

export const clipArtGallery: IClipArtGallery = {
  state: { status: "fetch-not-started" },
  setState: action((state, innerState) => {
    state.state = innerState;
  }),

  // Core work is in startFetchIfRequired().
  startFetchIfRequired: thunk(async (actions, _voidPayload, helpers) => {
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
      actions.setState({
        status: "fetch-failed",
        message: "There was an error fetching the media library.",
      });
    }
  }),
};
