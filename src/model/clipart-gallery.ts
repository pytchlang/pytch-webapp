import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { failIfNull } from "../utils";

const medialibRoot = failIfNull(
  process.env.REACT_APP_MEDIALIB_BASE,
  "must set REACT_APP_MEDIALIB_BASE env.var"
);

export type ClipArtGalleryItemId = number;

export type ClipArtGalleryItem = {
  id: ClipArtGalleryItemId;
  name: string;
  relativeUrl: string;
  url: string; // Populated when loaded
  tags: Array<string>;
};

export type ClipArtGalleryData = {
  items: Array<ClipArtGalleryItem>;
  tags: Array<string>;
};
export type ClipArtGalleryState =
  | { status: "fetch-not-started" }
  | { status: "fetch-pending" }
  | { status: "fetch-failed"; message: string }
  | ({ status: "ready" } & ClipArtGalleryData);

export interface IClipArtGallery {
  state: ClipArtGalleryState;
  setState: Action<IClipArtGallery, ClipArtGalleryState>;

  startFetchIfRequired: Thunk<IClipArtGallery, void, any, IPytchAppModel>;
}

const selectAllTags = (items: Array<ClipArtGalleryItem>): Array<string> => {
  let tags = new Set<string>();
  items.forEach((item) => {
    item.tags.forEach((tag) => tags.add(tag));
  });

  let sortedTags = Array.from(tags.values());
  sortedTags.sort();

  return sortedTags;
};

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
      const galleryItems = await resp.json();

      galleryItems.forEach((element: any) => {
        element.url = `${medialibRoot}/${element.relativeUrl}`;
      });

      const items: Array<ClipArtGalleryItem> = galleryItems;

      const tags: Array<string> = selectAllTags(items);

      actions.setState({ status: "ready", items, tags });
    } catch (e) {
      console.error("failed to fetch media library", e);
      actions.setState({
        status: "fetch-failed",
        message: "There was an error fetching the media library.",
      });
    }
  }),
};
