import { Thunk } from "easy-peasy";
import { IModalUserInteraction } from ".";
import JSZip from "jszip";
import { failIfNull } from "../../utils";
import * as MimeTypes from "mime-types";
import { IAddAssetDescriptor } from "../project";

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
