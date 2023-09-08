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

type IUpsertHatBlockSpecific = {
  operation: HandlerUpsertionOperation;

  setActorId: Action<IUpsertHatBlockSpecific, Uuid>;
  setAction: Action<IUpsertHatBlockSpecific, HandlerUpsertionAction>;
};

const upsertHatBlockSpecific: IUpsertHatBlockSpecific = {
  operation: { actorId: "", action: { kind: "insert" } },

  setActorId: action((state, actorId) => {
    state.operation.actorId = actorId;
  }),
  setAction: action((state, action) => {
    state.operation.action = action;
  }),
};
