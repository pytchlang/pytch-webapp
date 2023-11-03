import { assertNever } from "../../../utils";
import { Uuid, UuidOps } from "./core-types";

export type EventDescriptor =
  | { kind: "green-flag" }
  | { kind: "key-pressed"; keyName: string }
  | { kind: "message-received"; message: string }
  | { kind: "start-as-clone" }
  | { kind: "clicked" };

export type EventDescriptorKind = EventDescriptor["kind"];

export class EventDescriptorKindOps {
  /** Return the number of "arguments" the given `kind` of
   * event-descriptor needs.  This is always either `0` or `1`. */
  static arity(kind: EventDescriptorKind): number {
    switch (kind) {
      case "green-flag":
      case "clicked":
      case "start-as-clone":
        return 0;
      case "key-pressed":
      case "message-received":
        return 1;
      default:
        return assertNever(kind);
    }
  }
}

export class EventDescriptorOps {
}
