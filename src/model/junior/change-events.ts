import { ActorKind, EventDescriptorKind, Uuid } from "./structured-program";
import { HandlerUpsertionActionKind } from "./structured-program/program";

export type PerMethodScriptUpserted = {
  kind: "script-upserted";
  upsertKind: HandlerUpsertionActionKind;
  handlerId: Uuid;
  handlerEventKind: EventDescriptorKind;
  actorKind: ActorKind;
  actorName: string;
};

export function eqPerMethodScriptUpserted(
  x: PerMethodScriptUpserted,
  y: PerMethodScriptUpserted
) {
  return (
    x.kind === y.kind &&
    x.upsertKind === y.upsertKind &&
    x.handlerId === y.handlerId
  );
}
