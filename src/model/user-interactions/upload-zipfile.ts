import { Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import JSZip from "jszip";
import { failIfNull, withinApp } from "../../utils";
import {
  addAssetToProject,
  allProjectSummaries,
  createNewProject,
} from "../../database/indexed-db";
import * as MimeTypes from "mime-types";
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

type ErrorTransformation = (err: Error) => Error;

const bareError: ErrorTransformation = (err: Error): Error => err;

const wrappedError: ErrorTransformation = (err: Error): Error => {
  return new Error(
    "There was a problem uploading the zipfile." +
      `  (Technical details: ${err}.)`
  );
};

const _zipObjOrFail = (
  zip: JSZip,
  path: string,
  errorTransformation: ErrorTransformation
) => {
  const maybeZipObj = zip.file(path);
  if (maybeZipObj == null)
    throw errorTransformation(
      new Error(`could not find "${path}" within zipfile`)
    );

  return maybeZipObj;
};

const _jsonOrFail = async (
  zip: JSZip,
  path: string,
  errorTransformation: ErrorTransformation
) => {
  const zipObj = _zipObjOrFail(zip, path, errorTransformation);
  const text = await zipObj.async("text");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw errorTransformation(
      new Error(`could not parse contents of "${path}"`)
    );
  }
};

const _versionOrFail = async (zip: JSZip) => {
  const versionInfo = await _jsonOrFail(zip, "version.json");
  return failIfNull(
    versionInfo.pytchZipfileVersion,
    "version object does not contain pytchZipfileVersion property"
  );
};

const _zipAsset = async (
  path: string,
  zipObj: JSZip.JSZipObject
): Promise<IAddAssetDescriptor> => {
  const mimeType = MimeTypes.lookup(path);
  if (mimeType === false)
    throw new Error(`could not determine mime-type of "${path}"`);
  const data = await zipObj.async("arraybuffer");
  return { name: path, mimeType, data };
};

const attemptUpload = async (
  actions: Actions<IPytchAppModel>,
  descriptor: IUploadZipfileDescriptor
) => {
  const zip = await JSZip.loadAsync(descriptor.zipData);
  const versionNumber = await _versionOrFail(zip);
  switch (versionNumber) {
    case 1: {
      const codeText = await _zipObjOrFail(zip, "code/code.py").async("text");

      const metadata = await _jsonOrFail(zip, "meta.json");
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
          addAssetToProject(project.id, asset.name, asset.mimeType, asset.data)
        )
      );

      const summaries = await allProjectSummaries();
      actions.projectCollection.setAvailable(summaries);

      // TODO: Allow cancellation by user part-way through this process?

      await navigate(withinApp(`/ide/${project.id}`));
      break;
    }
    default:
      throw new Error(`unhandled Pytch zipfile version ${versionNumber}`);
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
