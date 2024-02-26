import { assertNever } from "../utils";
import {
  PerMethodScriptUpserted,
  eqPerMethodScriptUpserted,
} from "./junior/change-events";

// This will become a discriminated union type once there are more kinds
// of notable changes:
export type NotableChange = PerMethodScriptUpserted;

export type NotableChangeKind = NotableChange["kind"];

export function eqNotableChange(x: NotableChange, y: NotableChange): boolean {
  if (x.kind !== y.kind) return false;
  switch (x.kind) {
    case "script-upserted":
      return eqPerMethodScriptUpserted(x, y);
    default:
      return assertNever(x.kind);
  }
}
