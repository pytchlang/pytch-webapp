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

import { EventDescriptorKind } from "./structured-program/event";
import {
  HandlerUpsertionAction,
  HandlerUpsertionOperation,
} from "./structured-program/program";
import { Uuid } from "./structured-program/core-types";

type HandlerUpsertionMode = "choosing-hat-block" | "choosing-key";

type IUpsertHatBlockSpecific = {
  operation: HandlerUpsertionOperation;
  mode: HandlerUpsertionMode;
  chosenKind: EventDescriptorKind;

  setActorId: Action<IUpsertHatBlockSpecific, Uuid>;
  setAction: Action<IUpsertHatBlockSpecific, HandlerUpsertionAction>;
  setMode: Action<IUpsertHatBlockSpecific, HandlerUpsertionMode>;
  _setChosenKind: Action<IUpsertHatBlockSpecific, EventDescriptorKind>;
  setChosenKind: Thunk<IUpsertHatBlockSpecific, EventDescriptorKind>;
};

const upsertHatBlockSpecific: IUpsertHatBlockSpecific = {
  operation: { actorId: "", action: { kind: "insert" } },
  mode: "choosing-hat-block",
  chosenKind: "green-flag",

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
  }),
};
