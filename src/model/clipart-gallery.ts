import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { failIfNull } from "../utils";

const medialibRoot = failIfNull(
  process.env.REACT_APP_MEDIALIB_BASE,
  "must set REACT_APP_MEDIALIB_BASE env.var"
);

export type ClipArtGalleryItem = {
  id: number;
  name: string;
  data: any; // TODO: Work out what kind of image data should go here.
};

export type ClipArtGalleryState =
  | { status: "fetch-not-started" }
  | { status: "fetch-pending" }
  | { status: "fetch-failed"; message: string }
  | { status: "ready"; items: Array<ClipArtGalleryItem> };

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

    const resp = await fetch("http://localhost:8127/clipart_assets_list.json");
    const galleryItems = await resp.json();

    galleryItems.forEach((element: any) => {
      element.url = `http://localhost:8127/${element.data}`;
    });

    const items: Array<ClipArtGalleryItem> = galleryItems;

    actions.setState({ status: "ready", items });

    // TODO: Wrap the above in try/catch, and in catch do sth like
    //
    // actions.setState({
    //   status: "fetch-failed",
    //   message: "sorry something went wrong",
    // });
  }),
};
