import { i18n } from "i18next";
import { arraysEqFun, assertNever } from "../utils";
import {
  AssetChanged,
  assetChangedDescription,
  AssetsAdded,
  assetsAddedDescription,
  NotableChangeSummarySpec,
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
  FullScreenStatusChanged,
  fullScreenStatusChangedDescription,
} from "./junior/change-events";
import { I18nStringSpec } from "./i18n/core-types";
import { i18nTranslationOptions } from "./i18n/utils";

export type NotableChange =
  | FullScreenStatusChanged
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

// These are fully interpolated human-facing strings.
export type NotableChangeSummary = {
  header: string;
  body: Array<string>;
};

////////////////////////////////////////////////////////////////////////

function humanStringFromParts(
  i18n: i18n,
  keyPrefix: string,
  spec: I18nStringSpec,
  keySuffix: "header" | "body"
): string {
  const innerPart = spec.keyPart == null ? "" : `.${spec.keyPart}`;
  const baseKey = `${keyPrefix}${innerPart}`;
  const keyStem = `${baseKey}.${keySuffix}`;
  const tOptions = i18nTranslationOptions(i18n, spec);
  return i18n.t(keyStem, tOptions);
}

function changeSummaryFromSpec(
  i18n: i18n,
  keyPrefix: string,
  spec: NotableChangeSummarySpec
): NotableChangeSummary {
  const header = humanStringFromParts(i18n, keyPrefix, spec.header, "header");

  const bodyParts = spec.bodyParts.map((spec) =>
    humanStringFromParts(i18n, keyPrefix, spec, "body")
  );

  return {
    header,
    body: bodyParts,
  };
}

export function notableChangeDescription(
  i18n: i18n,
  change: NotableChange
): NotableChangeSummary {
  const spec = (() => {
    switch (change.kind) {
      case "full-screen-status-changed":
        return fullScreenStatusChangedDescription(change);
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
  })();

  return changeSummaryFromSpec(i18n, change.kind, spec);
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
