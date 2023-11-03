import { Uuid, UuidOps } from "./core-types";
import { EventHandler } from "./event";
import { assertNever } from "../../../utils";

export type ActorKind = "sprite" | "stage";
