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

  bootForProgram: Thunk<EditState, StructuredProgram>;
};

export const editState: EditState = {
  focusedActor: "",
  setFocusedActor: propSetterAction("focusedActor"),

  bootForProgram: thunk((actions, program) => {
    // Where is the right place to enforce the invariant that the [0]th
    // actor must be of kind "stage"?
    const stage = program.actors[0];
    actions.setFocusedActor(stage.id);
  }),
};
