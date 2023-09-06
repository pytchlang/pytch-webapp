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

  /** Remove the handler with the given `handlerId` from the given
   * `actor`, and return the removed handler.  Throw an error if there
   * is not exactly one handler with the given `handlerId` within
   * `actor`.
   * */
  static deleteHandlerById(actor: Actor, handlerId: Uuid): EventHandler {
    const handlerIdx = ActorOps.handlerIndexById(actor, handlerId);
    return actor.handlers.splice(handlerIdx, 1)[0];
  }

  /** Append the given `handler` to the list of handlers of the given
   * `actor`. */
  static appendHandler(actor: Actor, handler: EventHandler): void {
    const alreadyExists = ActorOps.hasHandlerById(actor, handler.id);
    if (alreadyExists)
      throw new Error(
        `appendHandler(): actor ${actor.id} already has` +
          ` a handler with id ${handler.id}`
      );

    actor.handlers.push(handler);
  }

  /** Re-order the handlers of the given `actor` such that the handler
   * with id `movingHandlerId` is removed from the array, and
   * re-inserted such that it is then at the index previously occupied
   * by the handler with id `targetHandlerId`.
   *
   * Example:
   *
   * ```text
   * [ a, b, moving, c, d, target, e, f ] -> [ a, b, c, d, target, moving, e, f ]
   * ```
   *
   * Another example:
   *
   * ```text
   * [ target, a, b, c, moving, d, e, f ] -> [ moving, target, a, b, c, d, e, f ]
   * ```
   * */
  static reorderHandlers(
    actor: Actor,
    movingHandlerId: Uuid,
    targetHandlerId: Uuid
  ): void {
    const srcIdx = ActorOps.handlerIndexById(actor, movingHandlerId);
    const tgtIdx = ActorOps.handlerIndexById(actor, targetHandlerId);
    const handlers = actor.handlers;

    let newHandlers: Array<EventHandler> = [];
    if (tgtIdx === srcIdx) {
      // Odd, but OK I suppose.
      newHandlers = handlers;
    } else if (tgtIdx > srcIdx) {
      newHandlers = handlers
        .slice(0, srcIdx)
        .concat(handlers.slice(srcIdx + 1, tgtIdx + 1));
      newHandlers.push(handlers[srcIdx]);
      newHandlers = newHandlers.concat(handlers.slice(tgtIdx + 1));
    } else if (tgtIdx < srcIdx) {
      newHandlers = handlers.slice(0, tgtIdx);
      newHandlers.push(handlers[srcIdx]);
      newHandlers = newHandlers
        .concat(handlers.slice(tgtIdx, srcIdx))
        .concat(handlers.slice(srcIdx + 1));
    } else {
      // REALLY should not get here.
      throw new Error(`${tgtIdx} and ${srcIdx} not ordered`);
    }
    actor.handlers = newHandlers;
  }
}

export type ActorSummary = {
  kind: ActorKind;
  handlerIds: Array<Uuid>;
};

export class ActorSummaryOps {
  /** Return `true`/`false` according to whether the given two
   * `ActorSummary` values are the same, in the sense of having the same
   * `kind` and having the same handler-id values in the same order. */
  static eq(x: ActorSummary, y: ActorSummary): boolean {
    return x.kind === y.kind && UuidOps.eqArrays(x.handlerIds, y.handlerIds);
  }
}