import { ActorKind, EventDescriptorKind, Uuid } from "./structured-program";
import { HandlerUpsertionActionKind } from "./structured-program/program";

export type PerMethodScriptUpserted = {
  kind: "script-upserted";
  upsertKind: HandlerUpsertionActionKind | "duplicate";
  handlerId: Uuid;
  handlerEventKind: EventDescriptorKind;
  actorKind: ActorKind;
  actorName: string;
};

// TODO: A given handler will only ever be part of one actor, so think
// it's OK to not compare the actorKind or actorName properties?
export function eqPerMethodScriptUpserted(
  x: PerMethodScriptUpserted,
  y: PerMethodScriptUpserted
) {
  return (
    x.upsertKind === y.upsertKind &&
    x.handlerId === y.handlerId &&
    x.handlerEventKind === y.handlerEventKind
  );
}
