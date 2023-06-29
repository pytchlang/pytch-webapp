// Model slice for state of how the user is editing a program of
// "per-method" kind.

import { Action, thunk, Thunk } from "easy-peasy";
import { Uuid } from "./structured-program/core-types";
import { StructuredProgram } from "./structured-program/program";
import { IPytchAppModel } from "..";
import { propSetterAction } from "../../utils";

export type EditState = {
  focusedActor: Uuid;
  setFocusedActor: Action<EditState, Uuid>;
};

export const editState: EditState = {
  focusedActor: "",
  setFocusedActor: propSetterAction("focusedActor"),
};
