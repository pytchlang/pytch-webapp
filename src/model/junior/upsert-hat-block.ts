import { Action } from "easy-peasy";
import { assertNever } from "../../utils";
import { IPytchAppModel, PytchAppModelActions } from "../../model";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  AttemptOutcome,
  setRunStateProp,
} from "../user-interactions/async-user-flow";
import { EventDescriptorKind } from "./structured-program/event";
import { HandlerUpsertionOperation } from "./structured-program/program";
import { descriptorFromBrowserKeyName, KeyDescriptor } from "./keyboard-layout";
import { ActorKind, HandlerInActorContext } from "./structured-program";

export type HandlerUpsertionMode = "choosing-hat-block" | "choosing-key";

const kSpaceKeyDescriptor = descriptorFromBrowserKeyName(" ");
const kDefaultWhenIReceiveMessage = "message-1";

type UpsertHatBlockRunArgs = {
  operation: HandlerUpsertionOperation;
  actorKind: ActorKind;
};

type UpsertHatBlockRunState = {
  operation: HandlerUpsertionOperation;
  actorKind: ActorKind;
  mode: HandlerUpsertionMode;
  chosenKind: EventDescriptorKind;
  keyIfChosen: KeyDescriptor;
  messageIfChosen: string;
};

type UpsertHatBlockOutcomeNub = {
  handler: HandlerInActorContext;
};

type UpsertHatBlockOutcome = AttemptOutcome<UpsertHatBlockOutcomeNub>;

type UpsertHatBlockBase = AsyncUserFlowSlice<
  IPytchAppModel,
  UpsertHatBlockRunArgs,
  UpsertHatBlockRunState,
  UpsertHatBlockOutcomeNub
>;

type SAction<ArgT> = Action<UpsertHatBlockBase, ArgT>;

type UpsertHatBlockActions = {
  setMode: SAction<HandlerUpsertionMode>;
  setChosenKind: SAction<EventDescriptorKind>;
  setKeyIfChosen: SAction<KeyDescriptor>;
  setMessageIfChosen: SAction<string>;
};

export type UpsertHatBlockFlow = UpsertHatBlockBase & UpsertHatBlockActions;

async function prepare(
  args: UpsertHatBlockRunArgs
): Promise<UpsertHatBlockRunState> {
  const { operation, actorKind } = args;

  // Ensure sensible starting values; these will be overwritten in the
  // case of an update to an existing key-pressed or message-received
  // hat-block.
  let keyIfChosen = kSpaceKeyDescriptor;
  let messageIfChosen = kDefaultWhenIReceiveMessage;
  let chosenKind: EventDescriptorKind = "green-flag";

  switch (operation.action.kind) {
    case "insert":
      // Default chosenKind is correct.
      break;
    case "update": {
      // Set starting kind and (if relevant) "key" and "message"
      // values to the existing event handler.
      const prevEvent = operation.action.previousEvent;
      const prevKind = prevEvent.kind;
      chosenKind = prevKind;
      switch (prevKind) {
        case "green-flag":
        case "clicked":
        case "start-as-clone":
          // Nothing further required.
          break;

        case "key-pressed": {
          const descr = descriptorFromBrowserKeyName(prevEvent.keyName);
          keyIfChosen = descr;
          break;
        }

        case "message-received":
          messageIfChosen = prevEvent.message;
          break;

        default:
          assertNever(prevKind);
      }
      break;
    }
    default:
      assertNever(operation.action);
  }

  return {
    operation,
    actorKind,
    mode: "choosing-hat-block",
    chosenKind,
    keyIfChosen,
    messageIfChosen,
  };
}

function isSubmittable(runState: UpsertHatBlockRunState): boolean {
  switch (runState.chosenKind) {
    case "green-flag":
    case "clicked":
    case "start-as-clone":
    case "key-pressed":
      return true;

    case "message-received":
      return runState.messageIfChosen !== "";

    default:
      return assertNever(runState.chosenKind);
  }
}

async function attempt(
  runState: UpsertHatBlockRunState,
  actions: PytchAppModelActions
): Promise<UpsertHatBlockOutcome> {
  const eventDescriptor = (() => {
    switch (runState.chosenKind) {
      case "green-flag":
      case "clicked":
      case "start-as-clone":
        return { kind: runState.chosenKind };

      case "key-pressed":
        return {
          kind: runState.chosenKind,
          keyName: runState.keyIfChosen.browserKeyName,
        };

      case "message-received":
        return { kind: runState.chosenKind, message: runState.messageIfChosen };

      default:
        return assertNever(runState.chosenKind);
    }
  })();

  const upsertionDescriptor = { ...runState.operation, eventDescriptor };

  // This action is sync.
  const handler = actions.activeProject.upsertHandler(upsertionDescriptor);

  return { needsModalNotification: false, nub: { handler } };
}

export let upsertHatBlockFlow: UpsertHatBlockFlow = (() => {
  const specificSlice: UpsertHatBlockActions = {
    setMode: setRunStateProp("mode"),
    setChosenKind: setRunStateProp("chosenKind"),
    setKeyIfChosen: setRunStateProp("keyIfChosen"),
    setMessageIfChosen: setRunStateProp("messageIfChosen"),
  };
  return asyncUserFlowSlice(specificSlice, { prepare, isSubmittable, attempt });
})();
