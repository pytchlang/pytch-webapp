import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import {
  ClipArtGalleryEntry,
  ClipArtGalleryEntryId,
} from "../clipart-gallery-core";
import { ProjectId } from "../project-core";
import { addRemoteAssetToProject } from "../../database/indexed-db";
import { propSetterAction } from "../../utils";
import {
  AssetOperationContext,
  assetOperationContextFromKey,
  AssetOperationContextKey,
  unknownAssetOperationContext,
} from "../asset";

type SelectClipArtDescriptor = {
  assetNamePrefix: string;
  entries: Array<ClipArtGalleryEntry>;
  projectId: ProjectId;
};
type IAddClipArtItemsBase = IModalUserInteraction<SelectClipArtDescriptor>;

export type OnClickArgs = {
  tag: string;
  isMultiSelect: boolean;
};

type AddClipArtLaunchArgs = {
  operationContextKey: AssetOperationContextKey;
  assetNamePrefix: string;
};

export interface IAddClipArtItemsSpecific {
  operationContext: AssetOperationContext;
  setOperationContext: Action<IAddClipArtItemsSpecific, AssetOperationContext>;
  assetNamePrefix: string;
  setAssetNamePrefix: Action<IAddClipArtItemsSpecific, string>;
  selectedIds: Array<ClipArtGalleryEntryId>;
  selectItemById: Action<IAddClipArtItemsSpecific, ClipArtGalleryEntryId>;
  deselectItemById: Action<IAddClipArtItemsSpecific, ClipArtGalleryEntryId>;
  selectedTags: Array<string>;
  onTagClick: Action<IAddClipArtItemsSpecific, OnClickArgs>;
  clear: Action<IAddClipArtItemsSpecific>;
  launch: Thunk<
    IAddClipArtItemsBase & IAddClipArtItemsSpecific,
    AddClipArtLaunchArgs
  >;
}

export const addClipArtItemsSpecific: IAddClipArtItemsSpecific = {
  operationContext: unknownAssetOperationContext,
  setOperationContext: propSetterAction("operationContext"),

  assetNamePrefix: "",
  setAssetNamePrefix: propSetterAction("assetNamePrefix"),

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

  launch: thunk((actions, { operationContextKey, assetNamePrefix }) => {
    const opContext = assetOperationContextFromKey(operationContextKey);
    actions.setOperationContext(opContext);
    actions.setAssetNamePrefix(assetNamePrefix);
    actions.clear();
    actions.superLaunch();
  }),
};

const attemptAddOneEntry = async (
  projectId: ProjectId,
  assetNamePrefix: string,
  entry: ClipArtGalleryEntry
) => {
  await Promise.all(
    entry.items.map((item) => {
      const fullName = `${assetNamePrefix}${item.name}`;
      return addRemoteAssetToProject(projectId, item.url, fullName);
    })
  );
};

export const attemptAddItems = async (
  actions: Actions<IPytchAppModel>,
  descriptor: SelectClipArtDescriptor
) => {
  // TODO: Give type:
  let failures = [];

  for (const item of descriptor.entries) {
    try {
      await attemptAddOneEntry(
        descriptor.projectId,
        descriptor.assetNamePrefix,
        item
      );
    } catch (err) {
      // Possibly more context would be useful here, e.g., if the item
      // is within a group and the user didn't know they were trying to
      // add "digit9.png".  Revisit if problematic.
      failures.push({
        itemName: item.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: (err as any).message,
      });
    }
  }

  await actions.activeProject.syncAssetsFromStorage();

  if (failures.length > 0) {
    let nbSuccess = descriptor.entries.length - failures.length;
    let clipArtMsg: string;
    if (nbSuccess === 0) {
      let msg = "oh, no! ";
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
        failures.forEach((failure) => {
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
        failures.forEach((failure) => {
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
        failures.forEach((failure) => {
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
