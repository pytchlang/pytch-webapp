import { Uuid, UuidOps } from "./core-types";
import { EventHandler } from "./event";
import { assertNever } from "../../../utils";

export type ActorKind = "sprite" | "stage";

export type ActorKindNames = {
  subclass: string;
  appearancesDisplay: string;
  appearancesDisplayTitle: string;
  appearancesAttribute: string;
};

export class ActorKindOps {
}
