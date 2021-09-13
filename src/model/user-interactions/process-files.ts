import { action, Action, thunk, Thunk } from "easy-peasy";
import { IPytchAppModel } from "..";

export type Failure = {
  fileName: string;
  reason: string;
};

type ScalarState =
  | { status: "idle" }
  | { status: "awaiting-user-choice" }
  | { status: "trying-to-add" };

type ScalarStatus = ScalarState["status"];

type State =
  | ScalarState
  | { status: "showing-failures"; failures: Array<Failure> };

type IProcessFilesBase = State & {
  setScalar: Action<IProcessFilesBase, ScalarStatus>;
  setFailed: Action<IProcessFilesBase, Array<Failure>>;
  launch: Thunk<IProcessFilesBase>;
  dismiss: Thunk<IProcessFilesBase>;
};

export type IProcessFilesInteraction = IProcessFilesBase & {
  tryProcess: Thunk<IProcessFilesBase, FileList, any, IPytchAppModel>;
};

export const processFilesBase: () => IProcessFilesBase = () => ({
  status: "idle",

  setScalar: action((_state, status) => ({ status })),

  setFailed: action((_state, failures) => ({
    status: "showing-failures",
    failures,
  })),

  launch: thunk((actions) => actions.setScalar("awaiting-user-choice")),

  dismiss: thunk((actions) => actions.setScalar("idle")),
});
