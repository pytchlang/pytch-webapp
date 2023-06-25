import { Action, Thunk, action, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { copyTextToClipboard, delaySeconds } from "../utils";

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
  maybeCopyCoords: Thunk<CoordsChooser, void, void, IPytchAppModel>;
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
  maybeCopyCoords: thunk(async (actions, _voidPayload, helpers) => {
    const position = helpers.getStoreState().ideLayout.pointerStagePosition;
    if (position.kind === "not-over-stage") {
      // Should never happen if click on stage but maybe we'll allow key Enter
      // too one day?
      return;
    }

    const coordsStr = `(${position.stageX}, ${position.stageY})`;

    await copyTextToClipboard(coordsStr);
    const seqnum = actions.setStateKind("active-with-copied-message");
    await delaySeconds(0.8);
    actions.conditionallySetStateKind({ seqnum, kind: "active" });
  }),
};
