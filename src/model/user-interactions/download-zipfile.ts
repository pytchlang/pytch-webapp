import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IModalUserInteraction, modalUserInteraction } from ".";

interface IDownloadZipfileDescriptor {
  data: Uint8Array;
}

type IDownloadZipfileBase = IModalUserInteraction<IDownloadZipfileDescriptor>;

interface IDownloadZipfileSpecific {
  liveCreationSeqnum: number;
  incrementLiveCreationSeqnum: Action<IDownloadZipfileSpecific>;
  fileContents: Uint8Array | null;
  setFileContents: Action<IDownloadZipfileSpecific, Uint8Array | null>;
}

const downloadZipfileSpecific: IDownloadZipfileSpecific = {
  liveCreationSeqnum: 0,
  incrementLiveCreationSeqnum: action((state) => {
    state.liveCreationSeqnum += 1;
  }),

  fileContents: null,
  setFileContents: action((state, fileContents) => {
    state.fileContents = fileContents;
  }),
};

export type IDownloadZipfileInteraction = IDownloadZipfileBase &
  IDownloadZipfileSpecific;
