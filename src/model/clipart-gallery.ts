import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";

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
