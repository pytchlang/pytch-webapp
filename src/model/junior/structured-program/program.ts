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
}
