import { Action, Thunk, action, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";

type StateKind = "idle" | "active" | "active-with-copied-message";

type State = {
  seqnum: number;
  kind: StateKind;
};

export type CoordsChooser = State & {
  _setState: Action<CoordsChooser, State>;
  setStateKind: Thunk<CoordsChooser, StateKind, void, IPytchAppModel, number>;
  conditionallySetStateKind: Thunk<
    CoordsChooser,
    State,
    void,
    IPytchAppModel,
    number | null
  >;
};

export let coordsChooser: CoordsChooser = {
  seqnum: 4001,
  kind: "idle",
  _setState: action((state, { seqnum, kind }) => {
    state.seqnum = seqnum;
    state.kind = kind;
  }),
  setStateKind: thunk((actions, kind, helpers) => {
    const currentSeqnum = helpers.getState().seqnum;
    const seqnum = currentSeqnum + 1;
    actions._setState({ seqnum, kind });
    return seqnum;
  }),
  conditionallySetStateKind: thunk((actions, { seqnum, kind }, helpers) => {
    const currentSeqnum = helpers.getState().seqnum;
    return currentSeqnum === seqnum ? actions.setStateKind(kind) : null;
  }),
};
