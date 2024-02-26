import {
  action,
  Action,
  Actions,
  computed,
  Computed,
  thunk,
  Thunk,
} from "easy-peasy";

import { IPytchAppModel } from "..";
import { assertNever, propSetterAction } from "../../utils";

import {
  IModalUserInteraction,
  modalUserInteraction,
} from "../user-interactions";
import { EventDescriptorKind } from "./structured-program/event";
import {
  HandlerUpsertionAction,
  HandlerUpsertionDescriptor,
  HandlerUpsertionOperation,
} from "./structured-program/program";
import { Uuid } from "./structured-program/core-types";
import { descriptorFromBrowserKeyName, KeyDescriptor } from "./keyboard-layout";

type IUpsertHatBlockBase = IModalUserInteraction<HandlerUpsertionOperation>;
type HandlerUpsertionMode = "choosing-hat-block" | "choosing-key";

const kSpaceKeyDescriptor = descriptorFromBrowserKeyName(" ");
const kDefaultWhenIReceiveMessage = "message-1";

// Any better way to represent the key-pressed and message-received
// arguments?

type IUpsertHatBlockSpecific = {
  _pulseSuccessMessage: false;

  operation: HandlerUpsertionOperation;
  mode: HandlerUpsertionMode;
  chosenKind: EventDescriptorKind;
  keyIfChosen: KeyDescriptor;
  messageIfChosen: string;
  upsertionDescriptor: Computed<
    IUpsertHatBlockSpecific,
    HandlerUpsertionDescriptor
  >;

  setActorId: Action<IUpsertHatBlockSpecific, Uuid>;
  setAction: Action<IUpsertHatBlockSpecific, HandlerUpsertionAction>;
  setMode: Action<IUpsertHatBlockSpecific, HandlerUpsertionMode>;
  _setChosenKind: Action<IUpsertHatBlockSpecific, EventDescriptorKind>;
  setChosenKind: Thunk<IUpsertHatBlockSpecific, EventDescriptorKind>;
  setKeyIfChosen: Action<IUpsertHatBlockSpecific, KeyDescriptor>;
  _setMessageIfChosen: Action<IUpsertHatBlockSpecific, string>;
  setMessageIfChosen: Thunk<IUpsertHatBlockSpecific, string>;
  refreshInputsReady: Action<IUpsertHatBlockBase & IUpsertHatBlockSpecific>;

  launch: Thunk<
    IUpsertHatBlockBase & IUpsertHatBlockSpecific,
    HandlerUpsertionOperation
  >;
  attemptIfReady: Thunk<IUpsertHatBlockInteraction, void, void, IPytchAppModel>;
};

const upsertHatBlockSpecific: IUpsertHatBlockSpecific = {
  _pulseSuccessMessage: false,

  operation: { actorId: "", action: { kind: "insert" } },
  mode: "choosing-hat-block",
  chosenKind: "green-flag",
  keyIfChosen: kSpaceKeyDescriptor,
  messageIfChosen: "",

  upsertionDescriptor: computed((state) => {
    const eventDescriptor = (() => {
      switch (state.chosenKind) {
        case "green-flag":
        case "clicked":
        case "start-as-clone":
          return { kind: state.chosenKind };

        case "key-pressed":
          return {
            kind: state.chosenKind,
            keyName: state.keyIfChosen.browserKeyName,
          };

        case "message-received":
          return { kind: state.chosenKind, message: state.messageIfChosen };

        default:
          return assertNever(state.chosenKind);
      }
    })();

    return {
      ...state.operation,
      eventDescriptor,
    };
  }),

  setActorId: action((state, actorId) => {
    state.operation.actorId = actorId;
  }),
  setAction: action((state, action) => {
    state.operation.action = action;
  }),

  setMode: propSetterAction("mode"),

  _setChosenKind: propSetterAction("chosenKind"),
  setChosenKind: thunk((actions, chosenKind) => {
    actions._setChosenKind(chosenKind);
    actions.refreshInputsReady();
  }),

  setKeyIfChosen: propSetterAction("keyIfChosen"),

  _setMessageIfChosen: propSetterAction("messageIfChosen"),
  setMessageIfChosen: thunk((actions, message) => {
    actions._setMessageIfChosen(message);
    actions.refreshInputsReady();
  }),

  refreshInputsReady: action((state) => {
    state.inputsReady = (() => {
      switch (state.chosenKind) {
        case "green-flag":
        case "clicked":
        case "start-as-clone":
        case "key-pressed":
          return true;

        case "message-received":
          return state.messageIfChosen !== "";

        default:
          return assertNever(state.chosenKind);
      }
    })();
  }),

  launch: thunk((actions, { actorId, action }) => {
    actions.setMode("choosing-hat-block");
    actions.setAction(action);
    actions.setActorId(actorId);

    // Ensure sensible starting values; these will be overwritten in the
    // case of an update to an existing key-pressed or message-received
    // hat-block.
    actions.setKeyIfChosen(kSpaceKeyDescriptor);
    actions.setMessageIfChosen(kDefaultWhenIReceiveMessage);

    switch (action.kind) {
      case "insert":
        actions.setChosenKind("green-flag");
        break;
      case "update": {
        // Set starting kind and (if relevant) "key" and "message"
        // values to the existing event handler.
        const prevEvent = action.previousEvent;
        const prevKind = prevEvent.kind;
        actions.setChosenKind(prevKind);
        switch (prevKind) {
          case "green-flag":
          case "clicked":
          case "start-as-clone":
            // Nothing further required.
            break;

          case "key-pressed": {
            const descr = descriptorFromBrowserKeyName(prevEvent.keyName);
            actions.setKeyIfChosen(descr);
            break;
          }

          case "message-received":
            actions.setMessageIfChosen(prevEvent.message);
            break;

          default:
            assertNever(prevKind);
        }
        break;
      }
      default:
        assertNever(action);
    }

    actions.superLaunch();
    actions.refreshInputsReady();
  }),

  attemptIfReady: thunk((actions, _voidPayload, helpers) => {
    const state = helpers.getState();
    if (state.inputsReady) {
      actions.attempt(state.upsertionDescriptor);
    }
  }),
};

const attemptUpsertion = async (
  actions: Actions<IPytchAppModel>,
  upsertionDescriptor: HandlerUpsertionDescriptor
) => {
  actions.activeProject.upsertHandler(upsertionDescriptor);
};

export type IUpsertHatBlockInteraction = IUpsertHatBlockBase &
  IUpsertHatBlockSpecific;

export const upsertHatBlockInteraction = modalUserInteraction(
  attemptUpsertion,
  upsertHatBlockSpecific
);
