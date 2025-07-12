import { arraysEqFun, assertNever } from "../utils";
import {
  AssetChanged,
  AssetsAdded,
  PerMethodScriptDeleted,
  PerMethodScriptUpserted,
  PerMethodSpriteChanged,
} from "./junior/change-events";
import {
  ActorOps,
  AssetMetaDataOps,
  EventDescriptorKindOps,
} from "./junior/structured-program";

export type NotableChange =
  | PerMethodScriptUpserted
  | PerMethodScriptDeleted
  | PerMethodSpriteChanged
  | AssetsAdded
  | AssetChanged;

export type NotableChangeKind = NotableChange["kind"];

export type NotableChangeOfKind<KindT extends NotableChangeKind> =
  NotableChange & { kind: KindT };

////////////////////////////////////////////////////////////////////////

type NotableChangeDescription = {
  header: string;
  body: string;
};

export function notableChangeDescription(
  change: NotableChange
): NotableChangeDescription {
  switch (change.kind) {
    case "script-upserted": {
      const eventKindDescription = EventDescriptorKindOps.displayDescription(
        change.handlerEventKind
      );
      const displayName = ActorOps.displayDescription({
        kind: change.actorKind,
        name: change.actorName,
      });
      switch (change.upsertKind) {
        case "insert": {
          return {
            header: "Script added",
            body:
              `New "${eventKindDescription}" script` +
              ` added to the ${displayName}.`,
          };
        }
        case "update": {
          return {
            header: "Script hat block changed",
            body:
              `Script in the ${displayName}` +
              ` changed to "${eventKindDescription}".`,
          };
        }
        case "duplicate": {
          return {
            header: "Script duplicated",
            body:
              `"${eventKindDescription}" script` +
              ` duplicated in the ${displayName}.`,
          };
        }
        default:
          return assertNever(change.upsertKind);
      }
    }

    case "script-deleted": {
      const eventKindDescription = EventDescriptorKindOps.displayDescription(
        change.handlerEventKind
      );
      const displayName = ActorOps.displayDescription({
        kind: change.actorKind,
        name: change.actorName,
      });
      return {
        header: "Script deleted",
        body: `"${eventKindDescription}" script deleted from the ${displayName}.`,
      };
    }

    case "sprite-changed": {
      const displayName = ActorOps.displayDescription({
        kind: "sprite",
        name: change.spriteName,
      });

      switch (change.spriteChangedKind) {
        case "insert": {
          return {
            header: "Sprite added",
            body: `${displayName} added to project`,
          };
        }

        case "update": {
          return {
            header: "Sprite renamed",
            body: `Sprite renamed to "${change.spriteName}"`,
          };
        }

        case "delete": {
          return {
            header: "Sprite deleted",
            body: `${displayName} deleted from project`,
          };
        }

        default:
          return assertNever(change.spriteChangedKind);
      }
    }

    case "assets-added": {
      const assetSingular = change.operationContext.assetSingularTitle;
      const assetPlural = change.operationContext.assetPlural;
      const nSuccesses = change.successes.length;
      const nFailures = change.failures.length;

      const failuresSummarySuffix =
        nFailures > 1
          ? ` (but problems with ${nFailures} other ${assetPlural})`
          : nFailures === 1
          ? ` (but problem with one other ${assetSingular.toLowerCase()})`
          : "";

      const sourceDisplayName = AssetMetaDataOps.assetSourceDisplayName(
        change.sourceKind
      );

      if (nSuccesses === 1) {
        return {
          header: `${assetSingular} added`,
          body:
            `${assetSingular} "${change.successes[0].displayName}"` +
            ` added from ${sourceDisplayName}${failuresSummarySuffix}`,
        };
      } else {
        return {
          header: `${nSuccesses} ${assetPlural} added`,
          body:
            `${nSuccesses} ${assetPlural} added` +
            ` from ${sourceDisplayName}${failuresSummarySuffix}`,
        };
      }
    }

    case "asset-changed": {
      const assetSingular = change.operationContext.assetSingularTitle;
      switch (change.assetChangedKind) {
        case "update-transform": {
          return {
            header: `${assetSingular} crop/scale updated`,
            body:
              `Crop/scale for ${assetSingular.toLowerCase()}` +
              ` "${change.assetDisplayName}" updated` +
              ` in ${change.operationContext.scope}`,
          };
        }
        case "update": {
          return {
            header: `${assetSingular} renamed`,
            body:
              `${assetSingular} renamed to "${change.assetDisplayName}"` +
              ` in ${change.operationContext.scope}`,
          };
        }
        case "delete": {
          return {
            header: `${assetSingular} deleted`,
            body:
              `${assetSingular} "${change.assetDisplayName}"` +
              ` deleted from ${change.operationContext.scope}`,
          };
        }
        default:
          return assertNever(change.assetChangedKind);
      }
    }

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
