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
    if (state.selectedIds.indexOf(itemId) === -1)
      state.selectedIds.push(itemId);
  }),
  deselectItemById: action((state, itemId) => {
    const index = state.selectedIds.indexOf(itemId);
    if (index !== -1) state.selectedIds.splice(index, 1);
  }),
  clear: action((state) => {
    state.selectedIds = [];
  }),
  launch: thunk((actions) => {
    actions.clear();
    actions.superLaunch();
  }),
};

export const attemptAddItems = async (
  actions: Actions<IPytchAppModel>,
  descriptor: SelectClipArtDescriptor
) => {
  const items = descriptor.galleryItems;
  const selectedItems = descriptor.selectedIds;
  let failures = [];

  for (const clipart of items) {
    const isSelected =
      selectedItems.findIndex((id) => id === clipart.id) !== -1;
    if (isSelected) {
      try {
        await addRemoteAssetToProject(
          descriptor.projectId,
          (clipart as any).url
        );
      } catch (err) {
        failures.push({
          itemName: clipart.name,
          message: (err as any).message,
        });
      }
    }
  }
  await actions.activeProject.syncAssetsFromStorage();
  if (failures.length > 0) {
    let nbSuccess = selectedItems.length - failures.length;
    let clipArtMsg: string;
    if (nbSuccess === 0) {
      let msg: string = "oh, no! ";
      if (failures.length === 1) {
        msg =
          msg +
          "The selected clipart can not be added (" +
          failures[0].itemName +
          ": " +
          failures[0].message;
      } else {
        msg =
          msg +
          "The " +
          failures.length +
          " selected cliparts can not be added (";
        failures.forEach((failure: any) => {
          clipArtMsg = failure.itemName + ": " + failure.message + " ";
          msg = msg + clipArtMsg;
        });
      }
      msg = msg + ") Please modify your selection.";
      throw new Error(msg);
    } else if (nbSuccess === 1) {
      let msg = nbSuccess + " clipart successfully added, but ";
      if (failures.length === 1) {
        msg =
          msg +
          "not the other (" +
          failures[0].itemName +
          ": " +
          failures[0].message;
      } else {
        msg = msg + "not the " + failures.length + " others (";
        failures.forEach((failure: any) => {
          let clipArtMsg: string =
            failure.itemName + ": " + failure.message + " ";
          msg = msg + clipArtMsg;
        });
      }
      msg = msg + ") Please modify your selection.";
      throw new Error(msg);
    } else {
      let msg = nbSuccess + " cliparts successfully added, but ";
      if (failures.length === 1) {
        msg =
          msg +
          "1 problem encontered (" +
          failures[0].itemName +
          ": " +
          failures[0].message;
      } else {
        msg = msg + failures.length + " problems encontered (";
        failures.forEach((failure: any) => {
          let clipArtMsg: string =
            failure.itemName + ": " + failure.message + " ";
          msg = msg + clipArtMsg;
        });
      }
      msg = msg + ") Please modify your selection.";
      throw new Error(msg);
    }
  }
};

export type IAddClipArtItemsInteraction = IAddClipArtItemsBase &
  IAddClipArtItemsSpecific;
export const addClipArtItemsInteraction = modalUserInteraction(
  attemptAddItems,
  addClipArtItemsSpecific
);
