import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { ClipArtGalleryItem } from "../clipart-gallery";
import { ProjectId } from "../projects";
import { addRemoteAssetToProject } from "../../database/indexed-db";

type SelectClipArtDescriptor = {
  selectedIds: Array<number>;
  galleryItems: Array<ClipArtGalleryItem>;
  projectId: ProjectId;
};
type IAddClipArtItemsBase = IModalUserInteraction<SelectClipArtDescriptor>;

export interface IAddClipArtItemsSpecific {
  selectedIds: Array<number>;
  selectItemById: Action<IAddClipArtItemsSpecific, number>;
  deselectItemById: Action<IAddClipArtItemsSpecific, number>;
  clear: Action<IAddClipArtItemsSpecific>;
  launch: Thunk<IAddClipArtItemsBase & IAddClipArtItemsSpecific, void>;
}

export const addClipArtItemsSpecific: IAddClipArtItemsSpecific = {
  selectedIds: [],
  selectItemById: action((state, itemId) => {
    if (state.selectedIds.indexOf(itemId) == -1) state.selectedIds.push(itemId);
  }),
  deselectItemById: action((state, itemId) => {
    const index = state.selectedIds.indexOf(itemId);
    if (index != -1) state.selectedIds.splice(index, 1);
  }),
  clear: action((state) => {
    state.selectedIds = [];
  }),
  launch: thunk((actions) => {
    actions.clear();
    actions.superLaunch();
  }),
};

