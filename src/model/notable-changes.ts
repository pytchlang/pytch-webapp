import { arraysEqFun, assertNever } from "../utils";
import {
  PerMethodScriptDeleted,
  PerMethodScriptUpserted,
  eqPerMethodScriptDeleted,
  eqPerMethodScriptUpserted,
} from "./junior/change-events";
import { ActorOps } from "./junior/structured-program";

export type NotableChange = PerMethodScriptUpserted | PerMethodScriptDeleted;

export type NotableChangeKind = NotableChange["kind"];

export type NotableChangeOfKind<KindT extends NotableChangeKind> =
  NotableChange & { kind: KindT };

export function eqNotableChange(x: NotableChange, y: NotableChange): boolean {
  if (x.kind !== y.kind) return false;
  switch (x.kind) {
    case "script-upserted":
      return eqPerMethodScriptUpserted(x, y as PerMethodScriptUpserted);
    case "script-deleted":
      return eqPerMethodScriptDeleted(x, y as PerMethodScriptDeleted);
    default:
      return assertNever(x);
  }
}

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
      const displayName = ActorOps.displayDescription({
        kind: change.actorKind,
        name: change.actorName,
      });
      switch (change.upsertKind) {
        case "insert": {
          return {
            header: "Script added",
            body:
              `New "${change.handlerEventKind}" script` +
              ` added to the ${displayName}.`,
          };
        }
        case "update": {
          return {
            header: "Script hat block changed",
            body:
              `Script in the ${displayName}` +
              ` changed to "${change.handlerEventKind}".`,
          };
        }
        case "duplicate": {
          return {
            header: "Script duplicated",
            body:
              `"${change.handlerEventKind}" script` +
              ` duplicated in the ${displayName}.`,
          };
        }
        default:
          return assertNever(change.upsertKind);
      }
    }

    case "script-deleted": {
    }
  }
}

export const eqNotableChangeArrays = arraysEqFun(eqNotableChange);

// Currently a KeyedNotableChange is immutable, so it's enough to
// compare IDs.  This might change if we move to a multi-phase
// presentation such as the blue ring lasting for a shorter time than
// the toast.
export const eqKeyedNotableChangeArrays = arraysEqFun<KeyedNotableChange>(
  (x, y) => x.changeId === y.changeId
);

const nextChangeId = (() => {
  let id = 42000;
  return () => id++;
})();

export type KeyedNotableChange = {
  changeId: number;
  change: NotableChange;
};

class KeyedNotableChangeOps {
  static make(change: NotableChange): KeyedNotableChange {
    const changeId = nextChangeId();
    return { changeId, change };
  }
}

export type NotableChangesManager = {
  keyedChanges: Array<KeyedNotableChange>;
};

export class NotableChangesManagerOps {
  static make(): NotableChangesManager {
    return { keyedChanges: [] };
  }

  static changesOfKind<KindT extends NotableChangeKind>(
    changesManager: NotableChangesManager,
    kind: KindT
  ): Array<NotableChangeOfKind<KindT>> {
    const changes = changesManager.keyedChanges
      .map((keyedChange) => keyedChange.change)
      .filter((change) => change.kind === kind);
    return changes as Array<NotableChangeOfKind<KindT>>;
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

  static deleteChange(
    changesManager: NotableChangesManager,
    changeId: number
  ): void {
    changesManager.keyedChanges = changesManager.keyedChanges.filter(
      (keyedChange) => keyedChange.changeId !== changeId
    );
  }
}
