import { assertNever, hexSHA256 } from "../../../utils";
import { Uuid, UuidOps } from "./core-types";
import { NoIdEventHandler } from "./skeleton";

export type EventDescriptor =
  | { kind: "green-flag" }
  | { kind: "key-pressed"; keyName: string }
  | { kind: "message-received"; message: string }
  | { kind: "start-as-clone" }
  | { kind: "clicked" };

export type EventDescriptorKind = EventDescriptor["kind"];

export class EventDescriptorKindOps {
  /** Return the number of "arguments" the given `kind` of
   * event-descriptor needs.  This is always either `0` or `1`. */
  static arity(kind: EventDescriptorKind): number {
    switch (kind) {
      case "green-flag":
      case "clicked":
      case "start-as-clone":
        return 0;
      case "key-pressed":
      case "message-received":
        return 1;
      default:
        return assertNever(kind);
    }
  }

  /** Return the human-readable name of the argument which the given
   * `kind` of event-descriptor needs, if any.  If the given `kind`
   * needs no arguments (for example, `"clicked"`), return `undefined`.
   * */
  static maybeArgumentName(kind: EventDescriptorKind): string | undefined {
    switch (kind) {
      case "green-flag":
      case "clicked":
      case "start-as-clone":
        return undefined;
      case "key-pressed":
        return "key";
      case "message-received":
        return "message";
      default:
        return assertNever(kind);
    }
  }
}

export class EventDescriptorOps {
  /** Return (as a string) the decorator to be used to mark a method as
   * responding to the given `event` descriptor.   */
  static decorator(event: EventDescriptor): string {
    switch (event.kind) {
      case "green-flag":
        return "@pytch.when_green_flag_clicked";
      case "clicked":
        // We get away with just using "when_this_SPRITE_clicked"
        // because the two Python-side when-clicked decorator functions
        // do the same thing, without regards for whether the class is a
        // Sprite or Stage subclass.
        return "@pytch.when_this_sprite_clicked";
      case "start-as-clone":
        return "@pytch.when_I_start_as_a_clone";
      case "key-pressed":
        return `@pytch.when_key_pressed("${event.keyName}")`;
      case "message-received":
        // TODO: What if event.message has a " character?
        return `@pytch.when_I_receive("${event.message}")`;
      default:
        return assertNever(event);
    }
  }

  /** Return a fingerprint of the given `event` descriptor, consisting
   * of the event kind and a kind-specific suffic separated by `:`.
   * This suffix is `-` for nullary event-kinds, and the SHA256 of the
   * event-kind argument (key-name or message) for unary event-kinds. */
  static async fingerprint(event: EventDescriptor): Promise<string> {
    const suffix = await (async () => {
      switch (event.kind) {
        case "green-flag":
        case "clicked":
        case "start-as-clone":
          return "-";
        case "key-pressed":
          return await hexSHA256(event.keyName);
        case "message-received":
          return await hexSHA256(event.message);
        default:
          return assertNever(event);
      }
    })();

    return `${event.kind}:${suffix}`;
  }

  /** Return a deep clone of the given `event`. */
  static clone(event: EventDescriptor): EventDescriptor {
    return Object.assign({}, event);
  }
}

export type ParsonsBlock = {
  id: number;
  index: number;
  indent: number;
  code: string;
};

export type EventHandlerEditMode = "free" | "parsons" | "read-only";
export type EventHandler = {
  id: Uuid;
  event: EventDescriptor;
  pythonCode: string;
  editMode: EventHandlerEditMode;
  ParsonsBlocks: Array<ParsonsBlock>;
};

export class EventHandlerOps {
  /** Return a new `EventHandler` with the given `event` descriptor and
   * with the empty string as its Python code. */
  static newWithEmptyCode(event: EventDescriptor, mode: EventHandlerEditMode = "free"): EventHandler {
    return { id: UuidOps.newRandom(), event, pythonCode: "", editMode: mode, ParsonsBlocks: [] };
  }

  /** Return a new `EventHandler` with a random `id` whose `event` and
   * `pythonCode` are taken from the given `noIdEventHandler`.  */
  static fromSkeleton(noIdEventHandler: NoIdEventHandler): EventHandler {
    const id = UuidOps.newRandom();
    return { id, ...noIdEventHandler, editMode: "free", ParsonsBlocks: [] };
  }

  /** Return a fingerprint of the given `handler`, consisting of its
   * event-descriptor fingerprint and a hash of the Python code,
   * separated by `:`. */
  static async fingerprint(handler: EventHandler): Promise<string> {
    const eventFingerprint = await EventDescriptorOps.fingerprint(
      handler.event
    );
    const codeHash = await hexSHA256(handler.pythonCode);
    return `${eventFingerprint}:${codeHash}`;
  }

  /** Return a deep clone of the given `handler`, except that the clone
   * has a fresh `id`. */
  static clone(handler: EventHandler): EventHandler {
    const id = UuidOps.newRandom();
    const event = EventDescriptorOps.clone(handler.event);
    const pythonCode = handler.pythonCode;
    return { id, event, pythonCode, editMode: "free", ParsonsBlocks: [] };
  }

  static setEditMode(handler: EventHandler, mode: EventHandlerEditMode): void {
    handler.editMode = mode;
  }



//   /** Remove the handler with the given `handlerId` from the given
//  * `actor`, and return the removed handler.  Throw an error if there
//  * is not exactly one handler with the given `handlerId` within
//  * `actor`.
//  * */
//   static deleteHandlerById(actor: Actor, handlerId: Uuid): EventHandler {
//     const handlerIdx = ActorOps.handlerIndexById(actor, handlerId);
//     return actor.handlers.splice(handlerIdx, 1)[0];
//   }

  /** Append the given `block` to the list of Parsons Blocks of the given
   * `hadler`. */
  static appendParsonsBlock(handler: EventHandler, block: ParsonsBlock): void {
    // const alreadyExists = ActorOps.hasHandlerById(actor, handler.id);
    // if (alreadyExists)
    //   throw new Error(
    //     `appendHandler(): actor ${actor.id} already has` +
    //       ` a handler with id ${handler.id}`
    //   );

    handler.ParsonsBlocks.push(block);
  }

//   /** Re-order the handlers of the given `actor` such that the handler
//    * with id `movingHandlerId` is removed from the array, and
//    * re-inserted such that it is then at the index previously occupied
//    * by the handler with id `targetHandlerId`.
//    *
//    * Example:
//    *
//    * ```text
//    * [ a, b, moving, c, d, target, e, f ] -> [ a, b, c, d, target, moving, e, f ]
//    * ```
//    *
//    * Another example:
//    *
//    * ```text
//    * [ target, a, b, c, moving, d, e, f ] -> [ moving, target, a, b, c, d, e, f ]
//    * ```
//    * */
//   static reorderHandlers(
//     actor: Actor,
//     movingHandlerId: Uuid,
//     targetHandlerId: Uuid
//   ): void {
//     const srcIdx = ActorOps.handlerIndexById(actor, movingHandlerId);
//     const tgtIdx = ActorOps.handlerIndexById(actor, targetHandlerId);
//     const handlers = actor.handlers;

//     let newHandlers: Array<EventHandler> = [];
//     if (tgtIdx === srcIdx) {
//       // Odd, but OK I suppose.
//       newHandlers = handlers;
//     } else if (tgtIdx > srcIdx) {
//       newHandlers = handlers
//         .slice(0, srcIdx)
//         .concat(handlers.slice(srcIdx + 1, tgtIdx + 1));
//       newHandlers.push(handlers[srcIdx]);
//       newHandlers = newHandlers.concat(handlers.slice(tgtIdx + 1));
//     } else if (tgtIdx < srcIdx) {
//       newHandlers = handlers.slice(0, tgtIdx);
//       newHandlers.push(handlers[srcIdx]);
//       newHandlers = newHandlers
//         .concat(handlers.slice(tgtIdx, srcIdx))
//         .concat(handlers.slice(srcIdx + 1));
//     } else {
//       // REALLY should not get here.
//       throw new Error(`${tgtIdx} and ${srcIdx} not ordered`);
//     }
//     actor.handlers = newHandlers;
//   }
}
