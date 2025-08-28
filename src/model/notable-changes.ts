import { arraysEqFun, assertNever } from "../utils";
import {
  AssetChanged,
  assetChangedDescription,
  AssetsAdded,
  assetsAddedDescription,
  PerMethodScriptChanged,
  perMethodScriptChangedDescription,
  PerMethodSpriteChanged,
  perMethodSpriteChangedDescription,
  ProjectDownloadActionCompleted,
  projectDownloadActionCompletedDescription,
  ZipfilesUploaded,
  zipfilesUploadedDescription,
  ProjectRenamed,
  projectRenamedDescription,
  ProjectsDeleted,
  projectsDeletedDescription,
} from "./junior/change-events";
import {
  ActorOps,
  AssetMetaDataOps,
  EventDescriptorKindOps,
} from "./junior/structured-program";

export type NotableChange =
  | PerMethodScriptChanged
  | PerMethodSpriteChanged
  | AssetsAdded
  | AssetChanged
  | ZipfilesUploaded
  | ProjectRenamed
  | ProjectsDeleted
  | ProjectDownloadActionCompleted;

export type NotableChangeKind = NotableChange["kind"];

export type NotableChangeOfKind<KindT extends NotableChangeKind> =
  NotableChange & { kind: KindT };

////////////////////////////////////////////////////////////////////////

export type NotableChangeDescription = {
  header: string;
  body: string;
};

export function notableChangeDescription(
  change: NotableChange
): NotableChangeDescription {
  switch (change.kind) {
    case "script-changed":
      return perMethodScriptChangedDescription(change);
    case "sprite-changed":
      return perMethodSpriteChangedDescription(change);
    case "asset-changed":
      return assetChangedDescription(change);
    case "assets-added":
      return assetsAddedDescription(change);
    case "zipfiles-uploaded":
      return zipfilesUploadedDescription(change);
    case "project-download-action-completed":
      return projectDownloadActionCompletedDescription(change);
    case "projects-deleted":
      return projectsDeletedDescription(change);
    case "project-renamed":
      return projectRenamedDescription(change);
    default:
      return assertNever(change);
  }
}

// Currently the `change` within a KeyedNotableChange is immutable, so
// it's enough to compare `changeId` and `isActive`.  This might change
// if we move to a multi-phase presentation such as the blue ring
// lasting for a shorter time than the toast.
export const eqKeyedNotableChangeArrays = arraysEqFun<KeyedNotableChange>(
  (x, y) => x.changeId === y.changeId && x.isActive === y.isActive
);

const nextChangeId = (() => {
  let id = 42000;
  return () => id++;
})();

export type KeyedNotableChange = {
  changeId: number;
  isActive: boolean;
  change: NotableChange;
};

class KeyedNotableChangeOps {
  static make(change: NotableChange): KeyedNotableChange {
    const changeId = nextChangeId();
    return { changeId, isActive: true, change };
  }
}

export type NotableChangesManager = {
  keyedChanges: Array<KeyedNotableChange>;
};

export class NotableChangesManagerOps {
  static make(): NotableChangesManager {
    return { keyedChanges: [] };
  }

  static addChange(
    changesManager: NotableChangesManager,
    change: NotableChange
  ): number {
    const keyedChange = KeyedNotableChangeOps.make(change);
    const changeId = keyedChange.changeId;
    changesManager.keyedChanges.push(keyedChange);
    return changeId;
  }

  static deactivateChange(
    changesManager: NotableChangesManager,
    changeId: number
  ) {
    let found = false;
    changesManager.keyedChanges.forEach((change) => {
      if (change.changeId === changeId) {
        if (found) {
          console.warn(`found duplicate changes with id ${changeId}`);
        }
        change.isActive = false;
        found = true;
      }
    });
  }

  static deleteChange(
    changesManager: NotableChangesManager,
    changeId: number
  ): void {
    changesManager.keyedChanges = changesManager.keyedChanges.filter(
      (keyedChange) => keyedChange.changeId !== changeId
    );
  }
}
