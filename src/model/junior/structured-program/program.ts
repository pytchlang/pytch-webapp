import { Actor, ActorOps, ActorSummary } from "./actor";
import { Uuid } from "./core-types";
import { EventDescriptor, EventHandler, EventHandlerOps } from "./event";
import { assertNever, hexSHA256 } from "../../../utils";
import { IEmbodyContext, NoIdsStructuredProject } from "./skeleton";
import { AssetMetaDataOps } from "./asset";
import { AssetNameAndType } from "../../../database/indexed-db";

export type StructuredProgram = {
  actors: Array<Actor>;
};

// The layers of types are here because in the app's use-case, we want
// to share functionality between the "Add Sprite" modal and the "Rename
// Sprite" modal.  At the time of constructing the modal, we know
// whether this is going to be an Insert or Update action, and if
// Update, on what actor.  So we have a type (SpriteUpsertionAction) for
// that concept.  We don't know until the user clicks "Go!" what the new
// name is, at which point we have the additional data we need
// (SpriteUpsertionData) and can put them together to make the complete
// bundle of arguments (SpriteUpsertionArgs).
//
// It's redundant to include previousName for "update", but it makes it
// easier to construct the modal dialog content.
export type SpriteUpsertionAction =
  | { kind: "insert" }
  | { kind: "update"; actorId: Uuid; previousName: string };
//
type SpriteUpsertionData = { name: string };
//
export type SpriteUpsertionArgs = SpriteUpsertionAction & SpriteUpsertionData;

// TODO: Re-do the following handler-upsertion types along the lines of
// the sprite-upsertion types (which I think are clearer).

// It's redundant to include the previousEvent here, since it could be
// looked up by the handlerId, but it makes things a bit simpler.  Maybe
// review?
export type HandlerUpsertionAction =
  | { kind: "insert" }
  | { kind: "update"; handlerId: Uuid; previousEvent: EventDescriptor };

export type HandlerUpsertionActionKind = HandlerUpsertionAction["kind"];

export type HandlerUpsertionOperation = {
  actorId: Uuid;
  action: HandlerUpsertionAction;
};

export type HandlerUpsertionDescriptor = HandlerUpsertionOperation & {
  eventDescriptor: EventDescriptor;
};

type HandlerLocator = {
  actorId: Uuid;
  handlerId: Uuid;
};

export type HandlerDuplicationDescriptor = HandlerLocator;

export type HandlerDeletionDescriptor = HandlerLocator;

export type HandlersReorderingDescriptor = {
  actorId: Uuid;
  movingHandlerId: Uuid;
  targetHandlerId: Uuid;
};

export type PythonCodeUpdateDescriptor = {
  actorId: Uuid;
  handlerId: Uuid;
  code: string;
};

type AssetSortRecord = {
  actorIdx: number;
  mimeSortKey: number;
  assetIdx: number;
};

function assetSortRecordOrdering(a: AssetSortRecord, b: AssetSortRecord) {
  if (a.actorIdx !== b.actorIdx) {
    return a.actorIdx - b.actorIdx;
  }
  return a.mimeSortKey - b.mimeSortKey;
}

export class StructuredProgramOps {
  /** Create and return a new `StructuredProgram` containing just an
   * empty Stage. */
  static newEmpty(): StructuredProgram {
    return { actors: [ActorOps.newEmptyStage()] };
  }

  /** Create a new `StructuredProgram` containing a Stage and one
   * Sprite having one handler. */
  static newSimpleExample(): StructuredProgram {
    let program = StructuredProgramOps.newEmpty();

    StructuredProgramOps.addSprite(program, "Snake");
    let sprite = program.actors[1];

    StructuredProgramOps.upsertHandler(program, {
      actorId: sprite.id,
      action: { kind: "insert" },
      eventDescriptor: { kind: "green-flag" },
    });
    sprite.handlers[0].pythonCode = 'self.say_for_seconds("Hi there!", 2.0)';

    return program;
  }

  /** Create and return a new `StructuredProgram` whose `actors` are
   * embodied from those of the given `skeleton`.  Actors' assets are
   * registered with the given `embodyContext`. */
  static fromSkeleton(
    skeleton: NoIdsStructuredProject,
    embodyContext: IEmbodyContext
  ): StructuredProgram {
    const actors = skeleton.actors.map((actor) =>
      ActorOps.fromSkeleton(actor, embodyContext)
    );
    return { actors };
  }

  /** Return a fingerprint of the given `program`, of the form
   *
   * _stage-fingerprint_`,`_sprite-1-fingerprint_`,`_sprite-2-fingerprint_`,`_etc_
   */
  static async fingerprint(program: StructuredProgram): Promise<string> {
    const fingerprintPromises = program.actors.map(ActorOps.fingerprint);
    const actorFingerprints = await Promise.all(fingerprintPromises);
    const hashInput = actorFingerprints.join(",");
    return await hexSHA256(hashInput);
  }

  /** Return a map from each actor's `id` to the index of that actor in
   * the given `program`. */
  static actorIndexFromIdLut(program: StructuredProgram): Map<Uuid, number> {
    let indexFromId = new Map<Uuid, number>();
    let actorIndex = 0;
    for (const actor of program.actors) {
      if (indexFromId.has(actor.id))
        throw new Error(`multiple actors with id ${actor.id}`);
      indexFromId.set(actor.id, actorIndex);
      ++actorIndex;
    }
    return indexFromId;
  }

  /** Return an array holding (in the same order) just those elements of
   * the given `asset` array which are "active" in the given `program`.
   * An asset is active if its _actorId_ correponds to one of the actors
   * in the given `program`.
   *
   * Non-active assets can exist because we don't delete the
   * asset-in-project records corresponding to a sprite from the
   * database when deleting that sprite.  See also comment in
   * `PytchProgramOps.assetsCanonicallyOrdered()`. */
  static filterActiveAssets<AssetT extends AssetNameAndType>(
    program: StructuredProgram,
    assets: Array<AssetT>
  ): Array<AssetT> {
    const actorIds = new Set<Uuid>(program.actors.map((a) => a.id));
    return assets.filter((a) => actorIds.has(AssetMetaDataOps.actorId(a.name)));
  }

  /** Return an array of indexes into the given `assets` such that
   * taking the elements in the order given by those indexes gives the
   * assets in "canonical" order.  This means that all assets for the
   * stage come first, then all assets for the first sprite, etc.
   * Within each actor, costumes/backdrops come before sounds.  Within
   * each mime-major-type, the order of the assets is preserved from the
   * input array to the output array.
   *
   * In more detail, after
   * ```
   * idxs = canonicalAssetOrder(program, assets);
   * ```
   * we have that `assets[idxs[0]]` is the first asset in the canonical
   * order (the Stage's first Backdrop), `assets[idxs[1]]` is the
   * second asset in the canonical order, etc.
   * */
  static canonicalAssetOrder(
    program: StructuredProgram,
    assets: Array<AssetNameAndType>
  ): Array<number> {
    const actorIndexFromId = StructuredProgramOps.actorIndexFromIdLut(program);

    let assetSortRecords: Array<AssetSortRecord> = assets.map(
      (asset, assetIdx) => {
        const actorId = AssetMetaDataOps.actorId(asset.name);
        const actorIdx = actorIndexFromId.get(actorId);
        if (actorIdx == null) {
          throw new Error(`no actor for asset ${asset.name}`);
        }

        const mimeType = AssetMetaDataOps.mimeMajorType(asset.mimeType);
        const mimeSortKey = AssetMetaDataOps.mimeMajorTypeSortKey(mimeType);

        return { actorIdx, mimeSortKey, assetIdx };
      }
    );

    // JS2019 onwards specifies that sort() be stable, so we can just
    // compare the actor index and mime-type.
    assetSortRecords.sort(assetSortRecordOrdering);

    const indexes = assetSortRecords.map((record) => record.assetIdx);
    return indexes;
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

  /** Return `true`/`false` according to whether the given `program` has
   * a Sprite with the given `name`.  */
  static hasSpriteByName(program: StructuredProgram, name: string): boolean {
    return program.actors.some((a) => a.kind === "sprite" && a.name === name);
  }

  // MUTATORS:

  /** Mutate the given `program` in-place by "upserting" (either
   * inserting or updating) a sprite according to the given
   * `upsertionArgs`, which should have a property `kind` describing the
   * action to take:
   *
   * * `"insert"` to insert a new sprite
   * * `"update"` to rename an existing sprite, as identified by the
   *   `actorId` and `previousName` properties of `upsertionArgs`
   *
   * together with a `name` property giving the new name.
   *
   * In the case of `"update"`, throw an error if there is no sprite
   * with the given `actorId`, or if there is such a sprite, but it is
   * not named `previousName`. */
  static upsertSprite(
    program: StructuredProgram,
    upsertionArgs: SpriteUpsertionArgs
  ): Uuid {
    switch (upsertionArgs.kind) {
      case "insert":
        return StructuredProgramOps.addSprite(program, upsertionArgs.name);
      case "update": {
        const { actorId, name, previousName } = upsertionArgs;
        let actor = StructuredProgramOps.uniqueActorById(program, actorId);

        if (actor.name !== upsertionArgs.previousName) {
          throw new Error(
            `expected Actor ${actorId}` +
              ` to have name "${previousName}"` +
              ` but it has name "${actor.name}"`
          );
        }
        if (StructuredProgramOps.hasSpriteByName(program, name))
          throw new Error(`already have sprite called "${name}"`);

        actor.name = name;
        return actorId;
      }
      default:
        return assertNever(upsertionArgs);
    }
  }

  /** Mutate in-place the given `program` by adding a new empty Sprite
   * with the given `name`. */
  static addSprite(program: StructuredProgram, name: string): Uuid {
    if (StructuredProgramOps.hasSpriteByName(program, name))
      throw new Error(`already have sprite called "${name}"`);

    // TODO: Reject name if not a valid Python identifier.  Could restrict
    // to beginner-friendly subset and/or impose additional constraints,
    // e.g., must start with capital letter.

    const sprite = ActorOps.newEmptySprite(name);
    program.actors.push(sprite);
    return sprite.id;
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

  /** Mutate the given `program` in-place by "upserting" (either
   * inserting or updating) an event handler for an event with the given
   * `eventDescriptor` for the actor with the given `actorId`:
   *
   * If `action.kind` is `"insert"`, insert a new event-handler with
   * empty code.
   *
   * If `action.kind` is `"update"`, find the unique existing handler
   * with the given `action.handlerId` and replace its event-descriptor
   * with the given `eventDescriptor`, leaving its code alone. */
  static upsertHandler(
    program: StructuredProgram,
    { actorId, action, eventDescriptor }: HandlerUpsertionDescriptor
  ): Uuid {
    let actor = StructuredProgramOps.uniqueActorById(program, actorId);
    switch (action.kind) {
      case "insert": {
        const handler = EventHandlerOps.newWithEmptyCode(eventDescriptor);
        ActorOps.appendHandler(actor, handler);
        return handler.id;
      }
      case "update": {
        let handler = ActorOps.handlerById(actor, action.handlerId);
        handler.event = eventDescriptor;
        return handler.id;
      }
      default:
        return assertNever(action);
    }
  }

  /** Mutate the given `program` in-place by duplicating the handler
   * with the given `handlerId` within the actor having the given
   * `actorId`. The new handler is inserted after the "source" handler.
   * Return the `id` of the newly-created handler.  Throw an error if
   * the specified actor or the specified handler cannot be found.
   */
  static duplicateHandler(
    program: StructuredProgram,
    { actorId, handlerId }: HandlerDuplicationDescriptor
  ): Uuid {
    let actor = StructuredProgramOps.uniqueActorById(program, actorId);
    return ActorOps.duplicateHandlerById(actor, handlerId);
  }

  /** Mutate the given `program` in-place by deleting the handler with
   * the given `handlerId` from the actor with the given `actorId`.
   * Throw an error if there is not exactly one such actor, or if there
   * is not exactly one such handler within the actor. */
  static deleteHandler(
    program: StructuredProgram,
    { actorId, handlerId }: HandlerDeletionDescriptor
  ): void {
    let actor = StructuredProgramOps.uniqueActorById(program, actorId);
    ActorOps.deleteHandlerById(actor, handlerId);
  }

  /** Mutate in-place the given `program` by re-ordering the handlers of
   * the actor with the given `actorId`.  The handlers are re-ordered
   * such that the handler with the given `movingHandlerId` will
   * afterwards be found at the index currently occupied by the handler
   * with the given `targetHandlerId`.  (See
   * `ActorOps.reorderHandlers()` for examples.)  Throw an error if the
   * actor or either of the handlers cannot uniquely be found. */
  static reorderHandlersOfActor(
    program: StructuredProgram,
    { actorId, movingHandlerId, targetHandlerId }: HandlersReorderingDescriptor
  ): void {
    let actor = StructuredProgramOps.uniqueActorById(program, actorId);
    ActorOps.reorderHandlers(actor, movingHandlerId, targetHandlerId);
  }

  /** Mutate in-place the given `program` by replacing, with the given
   * `code`, the Python code of the handler with the given `handlerId`
   * within the actor with the given `actorId`. */
  static updatePythonCode(
    program: StructuredProgram,
    { actorId, handlerId, code }: PythonCodeUpdateDescriptor
  ): void {
    let actor = StructuredProgramOps.uniqueActorById(program, actorId);
    let handler = ActorOps.handlerById(actor, handlerId);
    handler.pythonCode = code;
  }
}
