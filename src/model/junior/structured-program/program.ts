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

  /** Return array of the names of all `"sprite"`-kind Actors within the
   * given `program`. */
  static spriteNames(program: StructuredProgram): Array<string> {
    return program.actors.filter((a) => a.kind === "sprite").map((a) => a.name);
  }

  /** Return `true`/`false` according to whether the given `program` has
   * a Sprite with the given `name`.  */
  static hasSpriteByName(program: StructuredProgram, name: string): boolean {
    return program.actors.some((a) => a.kind === "sprite" && a.name === name);
  }

  // MUTATORS:

  /** Mutate in-place the given `program` by adding a new empty Sprite
   * with the given `name`. */
  static addSprite(program: StructuredProgram, name: string) {
    if (StructuredProgramOps.hasSpriteByName(program, name))
      throw new Error(`already have sprite called "${name}"`);

    // TODO: Reject name if not a valid Python identifier.  Could restrict
    // to beginner-friendly subset and/or impose additional constraints,
    // e.g., must start with capital letter.

    program.actors.push(ActorOps.newEmptySprite(name));
  }

  /** Mutate in-place the given `program` by deleting the Sprite with
   * the given `actorId`.  Throw an error if there is no such Sprite or
   * if the given `actorId` refers to the Stage.
   *
   * Return the `Uuid` (sprite-id) of an adjacent Actor to the
   * just-deleted one, using the Actor after the just-deleted one unless
   * the just-deleted Actor was the last one, in which case use the
   * actor before the just-deleted one. */
  static deleteSprite(program: StructuredProgram, actorId: Uuid): Uuid {
    const targetIndex = program.actors.findIndex((a) => a.id === actorId);
    if (targetIndex === -1)
      throw new Error(`could not find actor ${actorId} to delete`);

    const targetKind = program.actors[targetIndex].kind;
    if (targetKind !== "sprite")
      throw new Error(
        `actor ${actorId} should be of kind "sprite"` +
          ` but is of kind "${targetKind}`
      );

    const targetIsLast = targetIndex === program.actors.length - 1;
    const adjacentIndex = targetIsLast ? targetIndex - 1 : targetIndex + 1;
    const adjacentId = program.actors[adjacentIndex].id;

    program.actors.splice(targetIndex, 1);

    return adjacentId;
  }
}
