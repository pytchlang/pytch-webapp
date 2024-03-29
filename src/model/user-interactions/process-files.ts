import { action, Action, thunk, Thunk } from "easy-peasy";
import { IPytchAppModel } from "..";

export type FileProcessingFailure = {
  fileName: string;
  reason: string;
};

type ScalarState =
  | { status: "idle" }
  | { status: "awaiting-user-choice" }
  | { status: "trying-to-process" };

type ScalarStatus = ScalarState["status"];

type State =
  | ScalarState
  | { status: "showing-failures"; failures: Array<FileProcessingFailure> };

type IProcessFilesBase = {
  state: State;
  setScalar: Action<IProcessFilesBase, ScalarStatus>;
  setFailed: Action<IProcessFilesBase, Array<FileProcessingFailure>>;
  launch: Thunk<IProcessFilesBase>;
  dismiss: Thunk<IProcessFilesBase>;
};

export type IProcessFilesInteraction = IProcessFilesBase & {
  tryProcess: Thunk<IProcessFilesBase, FileList, void, IPytchAppModel>;
};

// This is a function returning a new object from a literal, rather than
// a simple constant.  Turned out that using a constant here (and spread
// into addAssetsInteraction and uploadZipfilesInteraction) resulted in
// "addAssetsInteraction.launch()" launching the upload-zipfiles modal.
// I didn't get to the bottom of this, but suspect it's to do with
// Easy-Peasy needing some way to map from the thunk to its place in the
// store, and this mechanism being confused if the self-same thunk
// appears in two different places in the store.
export const processFilesBase: () => IProcessFilesBase = () => ({
  state: { status: "idle" },

  setScalar: action((state, status) => {
    state.state = { status };
  }),

  setFailed: action((state, failures) => {
    state.state = {
      status: "showing-failures",
      failures,
    };
  }),

  launch: thunk((actions) => actions.setScalar("awaiting-user-choice")),

  dismiss: thunk((actions) => actions.setScalar("idle")),
});
