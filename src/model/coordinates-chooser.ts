import { Action, Thunk, action, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { copyTextToClipboard, delaySeconds, propSetterAction } from "../utils";

type StateKind = "idle" | "active" | "active-with-copied-message";

export type StagePosition = { stageX: number; stageY: number };

const kStageOrigin: StagePosition = { stageX: 0, stageY: 0 };

type State = {
  seqnum: number;
  kind: StateKind;
};

// Use a load-linked / store-conditional mechanism to handle the case
// that the user clicks to copy, then immediately dismisses the
// coords-chooser.  If that happens, we don't want to go back to state
// "active" after the delay.
//
// The chosen position is driven by the mouse (moving over the stage).
// It is "sticky": moving the mouse off the stage leaves it where it
// was.  Whenever the chooser becomes idle, the chosen position is reset
// to the origin, so that is where it starts next time.
export type CoordsChooser = State & {
  chosenPosition: StagePosition;
  _setState: Action<CoordsChooser, State>;
  setChosenPosition: Action<CoordsChooser, StagePosition>;
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
  chosenPosition: kStageOrigin,
  _setState: action((state, { seqnum, kind }) => {
    state.seqnum = seqnum;
    state.kind = kind;
    if (kind === "idle") {
      state.chosenPosition = kStageOrigin;
    }
  }),
  setChosenPosition: propSetterAction("chosenPosition"),
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
    const position = helpers.getState().chosenPosition;
    const coordsStr = `(${position.stageX}, ${position.stageY})`;

    await copyTextToClipboard(coordsStr);
    const seqnum = actions.setStateKind("active-with-copied-message");
    await delaySeconds(0.8);
    actions.conditionallySetStateKind({ seqnum, kind: "active" });
  }),
};
