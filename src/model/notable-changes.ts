import { arraysEqFun, assertNever } from "../utils";
import {
  PerMethodScriptUpserted,
  eqPerMethodScriptUpserted,
} from "./junior/change-events";

// This will become a discriminated union type once there are more kinds
// of notable changes:
export type NotableChange = PerMethodScriptUpserted;

export type NotableChangeKind = NotableChange["kind"];

export type NotableChangeOfKind<KindT extends NotableChangeKind> =
  NotableChange & { kind: KindT };

export function eqNotableChange(x: NotableChange, y: NotableChange): boolean {
  if (x.kind !== y.kind) return false;
  switch (x.kind) {
    case "script-upserted":
      return eqPerMethodScriptUpserted(x, y);
    default:
      return assertNever(x.kind);
  }
}

export const eqNotableChangeArrays = arraysEqFun(eqNotableChange);

const nextChangeId = (() => {
  let id = 42000;
  return () => id++;
})();

type KeyedNotableChange = {
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
}
