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
  /** Return the bundle of names used to talk about an actor of the
   * given `kind`. */
  static names(kind: ActorKind): ActorKindNames {
    switch (kind) {
      case "sprite":
        return {
          subclass: "Sprite",
          appearancesDisplay: "costumes",
          appearancesDisplayTitle: "Costumes",
          appearancesAttribute: "Costumes",
        };
      case "stage":
        return {
          subclass: "Stage",
          appearancesDisplay: "backdrops",
          appearancesDisplayTitle: "Backdrops",
          appearancesAttribute: "Backdrops",
        };
      default:
        return assertNever(kind);
    }
  }
}

export type Actor = {
  id: Uuid;
  kind: ActorKind;
  name: string;
  handlers: Array<EventHandler>;
};

export class ActorOps {
  /** Create and return a new `stage` `Actor` with no event-handlers.
   * */
  static newEmptyStage(): Actor {
    return {
      id: UuidOps.newRandom(),
      kind: "stage",
      name: "Stage",
      handlers: [],
    };
  }

  /** Create and return a new `sprite` `Actor` with no event-handlers.
   * */
  static newEmptySprite(name: string): Actor {
    return {
      id: UuidOps.newRandom(),
      kind: "sprite",
      name,
      handlers: [],
    };
  }

  /** Return the index into the `handlers` of the given `actor` of the
   * handler with the given `handlerId`.  Throw an error if there is not
   * exactly one such handler.
   */
  static handlerIndexById(actor: Actor, handlerId: Uuid): number {
    const isTargetHandler = (h: EventHandler): boolean => h.id === handlerId;
    const firstIdx = actor.handlers.findIndex(isTargetHandler);
    const lastIdx = actor.handlers.findLastIndex(isTargetHandler);

    if (firstIdx === -1) {
      throw new Error(`handler ${handlerId} not found in actor ${actor.id}`);
    }
    if (lastIdx !== firstIdx) {
      throw new Error(
        `handler ${handlerId} found more than once in actor ${actor.id}`
      );
    }

    return firstIdx;
  }

  /** Return the handler with the given `handlerId` from the given
   * `actor`.  Throw an error if there is not exactly one such handler.
   * */
  static handlerById(actor: Actor, handlerId: Uuid): EventHandler {
    const handlerIdx = ActorOps.handlerIndexById(actor, handlerId);
    return actor.handlers[handlerIdx];
  }

  /** Return whether the given `actor` has a handler with the given
   * `handlerId`. */
  static hasHandlerById(actor: Actor, handlerId: Uuid): boolean {
    const maybeIdx = actor.handlers.findIndex((h) => h.id === handlerId);
    return maybeIdx !== -1;
  }
}
