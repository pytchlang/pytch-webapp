import { Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { failIfNull, withinApp } from "../../utils";
import {
  addAssetToProject,
  allProjectSummaries,
  createNewProject,
} from "../../database/indexed-db";
import { IAddAssetDescriptor } from "../project";
import { navigate } from "@reach/router";

export interface IUploadZipfileDescriptor {
  zipName: string;
  zipData: ArrayBuffer;
}

type IUploadZipfileBase = IModalUserInteraction<IUploadZipfileDescriptor>;

interface IUploadZipfileSpecific {
  launch: Thunk<IUploadZipfileBase & IUploadZipfileSpecific>;
}

// Error machinery is a bit fiddly.  Sometimes we throw an error in the
// middle of a sequence of steps which might throw errors themselves.
// In this case, we do so in a try/catch, and in the "catch", we rethrow
// the error after wrapping in something a bit more friendly.  Other
// times we can throw an error outside any try/catch, in which case we
// explicitly wrap it at the point of throwing it.

const attemptUpload = async (
  actions: Actions<IPytchAppModel>,
  descriptor: IUploadZipfileDescriptor
) => {
  const zip = await _loadZipOrFail(descriptor.zipData);
  const versionNumber = await _versionOrFail(zip);
  switch (versionNumber) {
    case 1:
      try {
        const codeZipObj = _zipObjOrFail(zip, "code/code.py", bareError);
        const codeText = await codeZipObj.async("text");

        const metadata = await _jsonOrFail(zip, "meta.json", bareError);
        const projectName = failIfNull(
          metadata.projectName,
          "could not find project name in metadata"
        );
        if (typeof projectName !== "string")
          throw new Error("project name is not a string");

        const assetsZip = failIfNull(
          zip.folder("assets"),
          `could not enter folder "assets" of zipfile`
        );

        let assetPromises: Array<Promise<IAddAssetDescriptor>> = [];
        assetsZip.forEach((path, zipObj) =>
          assetPromises.push(_zipAsset(path, zipObj))
        );

        const assets = await Promise.all(assetPromises);

        const project = await createNewProject(
          projectName,
          `Created from zipfile "${descriptor.zipName}"`,
          undefined,
          codeText
        );

        await Promise.all(
          assets.map((asset) =>
            addAssetToProject(
              project.id,
              asset.name,
              asset.mimeType,
              asset.data
            )
          )
        );

        const summaries = await allProjectSummaries();
        actions.projectCollection.setAvailable(summaries);

        // TODO: Allow cancellation by user part-way through this process?

        await navigate(withinApp(`/ide/${project.id}`));
      } catch (err) {
        throw wrappedError(err);
      }
      break;
    default:
      throw wrappedError(
        new Error(`unhandled Pytch zipfile version ${versionNumber}`)
      );
  }
};

const uploadZipfileSpecific: IUploadZipfileSpecific = {
  launch: thunk((actions) => actions.superLaunch()),
};

export type IUploadZipfileInteraction = IUploadZipfileBase &
  IUploadZipfileSpecific;

export const uploadZipfileInteraction = modalUserInteraction(
  attemptUpload,
  uploadZipfileSpecific
);
