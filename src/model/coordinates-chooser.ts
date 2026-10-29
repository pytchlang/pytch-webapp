import { Action, Thunk, action, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { copyTextToClipboard, delaySeconds, propSetterAction } from "../utils";
import { stageHalfHeight, stageHalfWidth } from "../constants";

type StateKind = "idle" | "active" | "active-with-copied-message";

export type StagePosition = { stageX: number; stageY: number };

const kStageOrigin: StagePosition = { stageX: 0, stageY: 0 };

const clamp = (x: number, limit: number) =>
  Math.min(Math.max(x, -limit), limit);

// Something we want a screen reader to announce.  Only set by discrete
// user actions (key presses, copying), never by mouse movement, which
// would flood the screen reader.  Rendering this into the live region
// is done by the component, which owns the i18n.  The seqnum lets the
// component force a fresh DOM node even if the content is unchanged,
// so that a repeated announcement is still spoken.
export type CoordsChooserAnnouncementContent =
  | { kind: "moved"; position: StagePosition }
  | { kind: "copied"; position: StagePosition };

export type CoordsChooserAnnouncement = CoordsChooserAnnouncementContent & {
  seqnum: number;
};

type State = {
  seqnum: number;
  kind: StateKind;
};

export type MoveChosenPositionArgs =
  | { kind: "by"; dx: number; dy: number }
  | { kind: "to-origin" };

// Use a load-linked / store-conditional mechanism to handle the case
// that the user clicks to copy, then immediately dismisses the
// coords-chooser.  If that happens, we don't want to go back to state
// "active" after the delay.
//
// The chosen position is driven by both the mouse (moving over the
// stage) and the keyboard (arrow keys).  It is "sticky": moving the
// mouse off the stage leaves it where it was.  Whenever the chooser
// becomes idle, the chosen position is reset to the origin, so that is
// where it starts next time.
export type CoordsChooser = State & {
  chosenPosition: StagePosition;
  announcement: CoordsChooserAnnouncement | null;
  _setState: Action<CoordsChooser, State>;
  setChosenPosition: Action<CoordsChooser, StagePosition>;
  _announce: Action<CoordsChooser, CoordsChooserAnnouncementContent>;
  setStateKind: Thunk<CoordsChooser, StateKind, void, IPytchAppModel, number>;
  conditionallySetStateKind: Thunk<
    CoordsChooser,
    State,
    void,
    IPytchAppModel,
    number | null
  >;
  moveChosenPosition: Thunk<CoordsChooser, MoveChosenPositionArgs>;
  maybeCopyCoords: Thunk<CoordsChooser, void, void, IPytchAppModel>;
};

export let coordsChooser: CoordsChooser = {
  seqnum: 4001,
  kind: "idle",
  chosenPosition: kStageOrigin,
  announcement: null,
  _setState: action((state, { seqnum, kind }) => {
    state.seqnum = seqnum;
    state.kind = kind;
    if (kind === "idle") {
      state.chosenPosition = kStageOrigin;
      state.announcement = null;
    }
  }),
  setChosenPosition: propSetterAction("chosenPosition"),
  _announce: action((state, content) => {
    const seqnum = (state.announcement?.seqnum ?? 0) + 1;
    state.announcement = { ...content, seqnum };
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
  moveChosenPosition: thunk((actions, args, helpers) => {
    const position: StagePosition = (() => {
      switch (args.kind) {
        case "to-origin":
          return kStageOrigin;
        case "by": {
          const { stageX, stageY } = helpers.getState().chosenPosition;
          return {
            stageX: clamp(stageX + args.dx, stageHalfWidth),
            stageY: clamp(stageY + args.dy, stageHalfHeight),
          };
        }
      }
    })();

    actions.setChosenPosition(position);
    actions._announce({ kind: "moved", position });
  }),
  maybeCopyCoords: thunk(async (actions, _voidPayload, helpers) => {
    const position = helpers.getState().chosenPosition;
    const coordsStr = `(${position.stageX}, ${position.stageY})`;

    await copyTextToClipboard(coordsStr);
    actions._announce({ kind: "copied", position });
    const seqnum = actions.setStateKind("active-with-copied-message");
    await delaySeconds(0.8);
    actions.conditionallySetStateKind({ seqnum, kind: "active" });
  }),
};
