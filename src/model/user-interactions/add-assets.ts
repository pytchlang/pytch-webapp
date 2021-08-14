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

export type IAddAssetsInteraction = State & {
  setScalar: Action<IAddAssetsInteraction, ScalarStatus>;
  setFailed: Action<IAddAssetsInteraction, Array<Failure>>;
  launch: Thunk<IAddAssetsInteraction>;
  tryAdd: Thunk<IAddAssetsInteraction, FileList, any, IPytchAppModel>;
  dismiss: Thunk<IAddAssetsInteraction>;
};

export const addAssetsInteraction: IAddAssetsInteraction = {
  status: "idle",
};
