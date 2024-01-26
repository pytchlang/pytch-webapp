import { assertNever } from "../../../utils";
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
}

export type EventHandler = {
  id: Uuid;
  event: EventDescriptor;
  pythonCode: string;
};

export class EventHandlerOps {
  /** Return a new `EventHandler` with the given `event` descriptor and
   * with the empty string as its Python code. */
  static newWithEmptyCode(event: EventDescriptor): EventHandler {
    return { id: UuidOps.newRandom(), event, pythonCode: "" };
  }

  /** Return a new `EventHandler` with a random `id` whose `event` and
   * `pythonCode` are taken from the given `noIdEventHandler`.  */
  static fromSkeleton(noIdEventHandler: NoIdEventHandler): EventHandler {
    const id = UuidOps.newRandom();
    return { id, ...noIdEventHandler };
  }
}
