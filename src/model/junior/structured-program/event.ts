import { assertNever } from "../../../utils";
import { Uuid, UuidOps } from "./core-types";

export type EventDescriptor =
  | { kind: "green-flag" }
  | { kind: "key-pressed"; keyName: string }
  | { kind: "message-received"; message: string }
  | { kind: "start-as-clone" }
  | { kind: "clicked" };
