export { type Uuid, UuidOps } from "./core-types";

export {
  type AssetMetaData,
  AssetMetaDataOps,
  type AssetPathComponents,
} from "./asset";

export {
  type EventDescriptorKind,
  EventDescriptorKindOps,
  type EventDescriptor,
  EventDescriptorOps,
  type EventHandler,
  EventHandlerOps,
} from "./event";

export {
  type ActorKindNames,
  type ActorKind,
  ActorKindOps,
  type Actor,
  ActorOps,
  type ActorSummary,
  ActorSummaryOps,
} from "./actor";

export {
  type NameValidity,
  nameValidity,
  unusedSpriteName,
} from "./name-validity";

export {
  type StructuredProgram,
  type SpriteUpsertionArgs,
  type HandlerUpsertionAction,
  type HandlerUpsertionOperation,
  type HandlerUpsertionDescriptor,
  type HandlersReorderingDescriptor,
  type PythonCodeUpdateDescriptor,
  StructuredProgramOps,
} from "./program";

export {
  type SourceMapEntry,
  type LocationWithinHandler,
  SourceMap,
} from "./source-map";

export { PendingCursorWarp } from "./cursor-warp";

export { type FlattenResults, flattenProgram } from "./flatten";

export { type IEmbodyContext } from "./skeleton";
