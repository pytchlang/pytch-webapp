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
