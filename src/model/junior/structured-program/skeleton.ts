import { Uuid } from "./core-types";
import { ActorKind } from "./actor";
import { EventDescriptor } from "./event";

export type AssetDescriptor = {
  fileBasename: string;
};

export type NoIdEventHandler = {
  event: EventDescriptor;
  pythonCode: string;
};

export type NoIdActor = {
  kind: ActorKind;
  name: string;
  handlers: Array<NoIdEventHandler>;
  assets: Array<AssetDescriptor>;
};

export type NoIdsStructuredProject = {
  actors: Array<NoIdActor>;
};

/** When constructing a `StructuredProgram` (and in particular its
 * actors) from a `NoIdsStructuredProject` (i.e., "embodying" it), we
 * need to also keep track of the assets within the
 * `NoIdsStructuredProject`.  This is done by an object implementing
 * `IEmbodyContext`, which has a method the "embodiment" process can use
 * to register each actor's assets. */
export interface IEmbodyContext {
  registerActorAsset(actorId: Uuid, assetBasename: string): void;
}
