import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { delaySeconds } from "../../utils";

interface IDownloadZipfileDescriptor {
  data: Uint8Array;
}

type IDownloadZipfileBase = IModalUserInteraction<IDownloadZipfileDescriptor>;

interface IDownloadZipfileSpecific {
  liveCreationSeqnum: number;
  incrementLiveCreationSeqnum: Action<IDownloadZipfileSpecific>;
  fileContents: Uint8Array | null;
  setFileContents: Action<IDownloadZipfileSpecific, Uint8Array | null>;
  createContents: Thunk<IDownloadZipfileBase & IDownloadZipfileSpecific>;
  launch: Thunk<IDownloadZipfileBase & IDownloadZipfileSpecific, void>;
}

const attemptDownload = async (
  _actions: Actions<IPytchAppModel>,
  descriptor: IDownloadZipfileDescriptor
) => {
  console.log(
    "attemptDownload(): entering; data byte-length",
    descriptor.data.byteLength
  );

  // TODO: Do the actual work of "save-as".
};

const downloadZipfileSpecific: IDownloadZipfileSpecific = {
  liveCreationSeqnum: 0,
  incrementLiveCreationSeqnum: action((state) => {
    state.liveCreationSeqnum += 1;
  }),

  fileContents: null,
  setFileContents: action((state, fileContents) => {
    state.fileContents = fileContents;
  }),

  createContents: thunk(async (actions, _payload, helpers) => {
    actions.incrementLiveCreationSeqnum();
    actions.setFileContents(null);

    const workingCreationSeqnum = helpers.getState().liveCreationSeqnum;
    console.log("createContents(): working on seqnum", workingCreationSeqnum);

    // TODO: Replace these two lines with real code.
    //
    // TODO: When we get to it, I think a delaySeconds(0.0) will do the
    // job of yielding control back to the caller?
    //
    await delaySeconds(5.0);
    const zipContents = new Uint8Array(24);

    if (workingCreationSeqnum === helpers.getState().liveCreationSeqnum) {
      // We're still interested in this result; deploy it.
      actions.setFileContents(zipContents);
      actions.setInputsReady(true);
    } else {
      // Another request was launched while we were busy; just throw
      // away what we've computed.
    }
  }),

  launch: thunk((actions) => {
    // Do not await createContents(); let it run in its own time.
    actions.createContents();
    actions.superLaunch();
  }),
};

export type IDownloadZipfileInteraction = IDownloadZipfileBase &
  IDownloadZipfileSpecific;

export const downloadZipfileInteraction = modalUserInteraction(
  attemptDownload,
  downloadZipfileSpecific
);
