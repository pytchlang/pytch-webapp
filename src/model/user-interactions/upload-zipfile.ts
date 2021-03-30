import { Actions, Thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction } from ".";
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

const _zipObjOrFail = (zip: JSZip, path: string) => {
  const maybeZipObj = zip.file(path);
  if (maybeZipObj == null)
    throw new Error(`could not find "${path}" within zipfile`);
  return maybeZipObj;
};

const _jsonOrFail = async (zip: JSZip, path: string) => {
  const text = await _zipObjOrFail(zip, path).async("text");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`could not parse contents of "${path}"`);
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

      await navigate(withinApp(`/ide/${project.id}`));
      break;
    }
    default:
      throw new Error(`unhandled Pytch zipfile version ${versionNumber}`);
  }
};
