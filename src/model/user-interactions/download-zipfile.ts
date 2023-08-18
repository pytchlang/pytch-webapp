import { Action, action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel, PytchAppModelActions } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import {
  delaySeconds,
  propSetterAction,
  PYTCH_CYPRESS,
} from "../../utils";
import { saveAs } from "file-saver";
import { zipfileDataFromProject } from "../../storage/zipfile";
import {
  FormatSpecifier,
} from "../compound-text-input";

interface IDownloadZipfileDescriptor {
  filename: string;
  data: Uint8Array;
}

type IDownloadZipfileBase = IModalUserInteraction<IDownloadZipfileDescriptor>;

export type DownloadZipfileLaunchArgs = {
  formatSpecifier: FormatSpecifier;
};

interface IDownloadZipfileSpecific {
  liveCreationSeqnum: number;
  incrementLiveCreationSeqnum: Action<IDownloadZipfileSpecific>;

  formatSpecifier: FormatSpecifier;
  setFormatSpecifier: Action<IDownloadZipfileSpecific, FormatSpecifier>;

  uiFragmentValue: string; // "ui" = "user input"
  _setUiFragmentValue: Action<IDownloadZipfileSpecific, string>;
  setUiFragmentValue: Thunk<IDownloadZipfileSpecific, string>;

  fileContents: Uint8Array | null;
  _setFileContents: Action<IDownloadZipfileSpecific, Uint8Array | null>;
  setFileContents: Thunk<IDownloadZipfileSpecific, Uint8Array | null>;

  refreshInputsReady: Thunk<IDownloadZipfileBase & IDownloadZipfileSpecific>;
  createContents: Thunk<
    IDownloadZipfileBase & IDownloadZipfileSpecific,
    number,
    void,
    IPytchAppModel
  >;
  launch: Thunk<
    IDownloadZipfileBase & IDownloadZipfileSpecific,
    DownloadZipfileLaunchArgs
  >;
}

const attemptDownload = async (
  _actions: PytchAppModelActions,
  descriptor: IDownloadZipfileDescriptor
) => {
  console.log(
    "attemptDownload(): entering; data byte-length",
    descriptor.data.byteLength
  );

  const zipBlob = new Blob([descriptor.data], { type: "application/zip" });
  console.log("attemptDownload(): created blob of size", zipBlob.size);

  // Add ".zip" extension if not already present.
  const alreadyHaveExtension = descriptor.filename.endsWith(".zip");
  const extraExtension = alreadyHaveExtension ? "" : ".zip";
  const downloadFilename = `${descriptor.filename}${extraExtension}`;

  // Currently no easy way to automate testing of downloaded files, so
  // at least make it so we can test up to the point of creating the blob
  // ready for download.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Cypress) {
    PYTCH_CYPRESS()["latestDownloadZipfile"] = {
      filename: downloadFilename,
      blob: zipBlob,
    };
  } else {
    saveAs(zipBlob, downloadFilename);
  }
};

const downloadZipfileSpecific: IDownloadZipfileSpecific = {
  liveCreationSeqnum: 0,
  incrementLiveCreationSeqnum: action((state) => {
    state.liveCreationSeqnum += 1;
  }),

  formatSpecifier: [], // Set properly in launch()
  setFormatSpecifier: propSetterAction("formatSpecifier"),

  uiFragmentValue: "",
  _setUiFragmentValue: propSetterAction("uiFragmentValue"),
  setUiFragmentValue: thunk((actions, uiFragmentValue) => {
    actions._setUiFragmentValue(uiFragmentValue);
    actions.refreshInputsReady();
  }),

  fileContents: null,
  _setFileContents: propSetterAction("fileContents"),
  setFileContents: thunk((actions, fileContents) => {
    actions._setFileContents(fileContents);
    actions.refreshInputsReady();
  }),

  refreshInputsReady: thunk((actions, _payload, helpers) => {
    const state = helpers.getState();
    actions.setInputsReady(state.filename !== "" && state.fileContents != null);
  }),

  createContents: thunk(async (actions, workingCreationSeqnum, helpers) => {
    console.log("createContents(): working on seqnum", workingCreationSeqnum);

    // TODO: Should we SAVE the project code first?

    // Delay briefly, otherwise we get a flash of the spinner, which
    // looks odd.
    await delaySeconds(1.0);

    const project = helpers.getStoreState().activeProject.project;
    if (project == null) {
      // Maybe the user cancelled and then went back to "my stuff";
      // abandon creation attempt.
      console.log("createContents(): no project; abandoning");
      return;
    }

    const zipContents = await zipfileDataFromProject(project);

    if (workingCreationSeqnum === helpers.getState().liveCreationSeqnum) {
      // We're still interested in this result; deploy it.
      actions.setFileContents(zipContents);
    } else {
      // Another request was launched while we were busy; just throw
      // away what we've computed.
    }
  }),

  launch: thunk((actions, { formatSpecifier }, helpers) => {
    actions.setFormatSpecifier(formatSpecifier);

    // Let filename be whatever it was last time, in case the user has
    // chosen a particular name and wants to re-download.

    actions.incrementLiveCreationSeqnum();
    actions.setFileContents(null);
    const workingCreationSeqnum = helpers.getState().liveCreationSeqnum;

    // Do not await createContents(); let it run in its own time.
    actions.createContents(workingCreationSeqnum);
    actions.superLaunch();
  }),
};

export type IDownloadZipfileInteraction = IDownloadZipfileBase &
  IDownloadZipfileSpecific;

export const downloadZipfileInteraction = modalUserInteraction(
  attemptDownload,
  downloadZipfileSpecific
);
