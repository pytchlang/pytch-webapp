import { Actor, ActorOps, ActorSummary } from "./actor";
import { Uuid } from "./core-types";
import { EventDescriptor, EventHandler, EventHandlerOps } from "./event";
import { assertNever } from "../../../utils";

export type StructuredProgram = {
  actors: Array<Actor>;
};

export class StructuredProgramOps {
  /** Create and return a new `StructuredProgram` containing just an
   * empty Stage. */
  static newEmpty(): StructuredProgram {
    return { actors: [ActorOps.newEmptyStage()] };
  }

  /** Return the unique `Actor` with the given `actorId` in the given
   * `program`.  Throw an error if there is not exactly one such
   * `Actor`.  */
  static uniqueActorById(program: StructuredProgram, actorId: Uuid): Actor {
    const matchingActors = program.actors.filter((a) => a.id === actorId);
    const nMatching = matchingActors.length;

    if (nMatching !== 1)
      throw new Error(`found ${nMatching} actors with id ${actorId}`);

    return matchingActors[0];
  }

  /** Return an `ActorSummary` for the unique `Actor` with the given
   * `actorId` within the given `program`.  Throw an error if there is
   * not exactly one such `Actor`. */
  static uniqueActorSummaryById(
    program: StructuredProgram,
    actorId: Uuid
  ): ActorSummary {
    const actor = StructuredProgramOps.uniqueActorById(program, actorId);
    return {
      kind: actor.kind,
      handlerIds: actor.handlers.map((h) => h.id),
    };
  }

  /** Return the unique `EventHandler` with the given `handlerId` within
   * the given `program`.  Throw an error if there is not exactly one
   * such event-handler.  If you know which `Actor` the handler belongs
   * to, it is more efficient to use `ActorOps.handlerById()`. */
  static uniqueHandlerByIdGlobally(
    program: StructuredProgram,
    handlerId: Uuid
  ): EventHandler {
    let matchingHandler = null;
    for (const actor of program.actors) {
      for (const handler of actor.handlers) {
        if (handler.id === handlerId) {
          if (matchingHandler != null)
            throw new Error(`multiple handlers with id ${handlerId}`);
          matchingHandler = handler;
        }
      }
    }

    if (matchingHandler == null)
      throw new Error(`could not find handler with id ${handlerId}`);

    return matchingHandler;
  }
}
