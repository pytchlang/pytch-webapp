import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { delaySeconds } from "../../utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { assetData } from "../../database/indexed-db";

interface IDownloadZipfileDescriptor {
  data: Uint8Array;
}

type IDownloadZipfileBase = IModalUserInteraction<IDownloadZipfileDescriptor>;

interface IDownloadZipfileSpecific {
  liveCreationSeqnum: number;
  incrementLiveCreationSeqnum: Action<IDownloadZipfileSpecific>;
  fileContents: Uint8Array | null;
  setFileContents: Action<IDownloadZipfileSpecific, Uint8Array | null>;
  createContents: Thunk<
    IDownloadZipfileBase & IDownloadZipfileSpecific,
    void,
    any,
    IPytchAppModel
  >;
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

  const zipBlob = new Blob([descriptor.data], { type: "application/zip" });
  console.log("attemptDownload(): created blob of size", zipBlob.size);

  // TODO: Allow user to specify filename.
  saveAs(zipBlob, "pytch-project.zip");
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

    const zipFile = new JSZip();

    zipFile.file("code.py", project.codeText);

    await Promise.all(
      project.assets.map(async (asset) => {
        // TODO: Once we're able to delete assets, the following might fail:
        const data = await assetData(asset.id);
        zipFile.file(asset.name, data);
      })
    );

    const zipContents = await zipFile.generateAsync({ type: "uint8array" });

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
