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

const spaceKeyDescriptor = descriptorFromBrowserKeyName(" ");

type IUpsertHatBlockSpecific = {
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
};

const upsertHatBlockSpecific: IUpsertHatBlockSpecific = {
  operation: { actorId: "", action: { kind: "insert" } },
  mode: "choosing-hat-block",
  chosenKind: "green-flag",
  keyIfChosen: spaceKeyDescriptor,
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
};
