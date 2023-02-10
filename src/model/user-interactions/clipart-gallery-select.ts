import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import {
  ClipArtGalleryEntry,
  ClipArtGalleryEntryId,
} from "../clipart-gallery-core";
import { ProjectId } from "../projects";
import { addRemoteAssetToProject } from "../../database/indexed-db";

type SelectClipArtDescriptor = {
  entries: Array<ClipArtGalleryEntry>;
  projectId: ProjectId;
};
type IAddClipArtItemsBase = IModalUserInteraction<SelectClipArtDescriptor>;

export type OnClickArgs = {
  tag: string;
  isMultiSelect: boolean;
};

export interface IAddClipArtItemsSpecific {
  selectedIds: Array<ClipArtGalleryEntryId>;
  selectItemById: Action<IAddClipArtItemsSpecific, ClipArtGalleryEntryId>;
  deselectItemById: Action<IAddClipArtItemsSpecific, ClipArtGalleryEntryId>;
  selectedTags: Array<string>;
  onTagClick: Action<IAddClipArtItemsSpecific, OnClickArgs>;
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

  selectedTags: [],
  onTagClick: action((state, { tag, isMultiSelect }) => {
    if (tag === "--all--") {
      state.selectedTags = [];
    } else {
      if (isMultiSelect) {
        const mExistingIndex = state.selectedTags.indexOf(tag);
        if (mExistingIndex === -1) {
          state.selectedTags.push(tag);
        } else {
          state.selectedTags.splice(mExistingIndex, 1);
        }
      } else {
        state.selectedTags = [tag];
      }
    }
  }),

  clear: action((state) => {
    state.selectedIds = [];
    // Leave selectedTags alone; likely that user will want to select
    // more media under the same set of tags as they set up last time
    // they use the dialog.
  }),
  launch: thunk((actions) => {
    actions.clear();
    actions.superLaunch();
  }),
};

const attemptAddOneEntry = async (
  projectId: ProjectId,
  entry: ClipArtGalleryEntry
) => {
  await Promise.all(
    entry.items.map((item) =>
      addRemoteAssetToProject(projectId, item.url, item.name)
    )
  );
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
          clipart.url,
          clipart.name
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
