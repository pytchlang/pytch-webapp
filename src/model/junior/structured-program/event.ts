import * as z from "zod/mini";
import { assertNever, hexSHA256 } from "../../../utils";
import { zUuid, UuidOps } from "./core-types";
import { NoIdEventHandler } from "./skeleton";

const zEventDescriptorGreenFlag = z.strictObject({
  kind: z.literal("green-flag"),
});
const zEventDescriptorActorClicked = z.strictObject({
  kind: z.literal("clicked"),
});
const zEventDescriptorStartAsClone = z.strictObject({
  kind: z.literal("start-as-clone"),
});
const zEventDescriptorKeyPressed = z.strictObject({
  kind: z.literal("key-pressed"),
  keyName: z.string(),
});
const zEventDescriptorMessageReceived = z.strictObject({
  kind: z.literal("message-received"),
  message: z.string(),
});

export const zEventDescriptor = z.discriminatedUnion("kind", [
  zEventDescriptorGreenFlag,
  zEventDescriptorActorClicked,
  zEventDescriptorStartAsClone,
  zEventDescriptorKeyPressed,
  zEventDescriptorMessageReceived,
]);
export type EventDescriptor = z.infer<typeof zEventDescriptor>;

export type EventDescriptorKind = EventDescriptor["kind"];

export class EventDescriptorKindOps {
  /** Return the number of "arguments" the given `kind` of
   * event-descriptor needs.  This is always either `0` or `1`. */
  static hasArgument(
    kind: EventDescriptorKind
  ): kind is "key-pressed" | "message-received" {
    switch (kind) {
      case "green-flag":
      case "clicked":
      case "start-as-clone":
        return false;
      case "key-pressed":
      case "message-received":
        return true;
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
        // do the same thing, without regard for whether the class is a
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

export const zEventHandler = z.strictObject({
  id: zUuid,
  event: zEventDescriptor,
  pythonCode: z.string(),
});
export type EventHandler = z.infer<typeof zEventHandler>;

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
    return { id, event, pythonCode };
  }
}
