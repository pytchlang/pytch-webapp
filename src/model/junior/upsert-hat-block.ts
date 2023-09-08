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
  HandlerUpsertionAction,
  HandlerUpsertionOperation,
} from "./structured-program/program";
import { Uuid } from "./structured-program/core-types";

type HandlerUpsertionMode = "choosing-hat-block" | "choosing-key";

type IUpsertHatBlockSpecific = {
  operation: HandlerUpsertionOperation;
  mode: HandlerUpsertionMode;

  setActorId: Action<IUpsertHatBlockSpecific, Uuid>;
  setAction: Action<IUpsertHatBlockSpecific, HandlerUpsertionAction>;
  setMode: Action<IUpsertHatBlockSpecific, HandlerUpsertionMode>;
};

const upsertHatBlockSpecific: IUpsertHatBlockSpecific = {
  operation: { actorId: "", action: { kind: "insert" } },
  mode: "choosing-hat-block",

  setActorId: action((state, actorId) => {
    state.operation.actorId = actorId;
  }),
  setAction: action((state, action) => {
    state.operation.action = action;
  }),

  setMode: propSetterAction("mode"),
};
