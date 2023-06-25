import { Action, Thunk, action, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";

type StateKind = "idle" | "active" | "active-with-copied-message";

type State = {
  seqnum: number;
  kind: StateKind;
};

export type CoordsChooser = State & {
  _setState: Action<CoordsChooser, State>;
};

export let coordsChooser: CoordsChooser = {
  seqnum: 4001,
  kind: "idle",
  _setState: action((state, { seqnum, kind }) => {
    state.seqnum = seqnum;
    state.kind = kind;
  }),
};
