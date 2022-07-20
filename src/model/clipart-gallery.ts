import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";

export type ClipArtGalleryItem = {
  id: number;
  name: string;
  data: any; // TODO: Work out what kind of image data should go here.
};
