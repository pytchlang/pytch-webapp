import { Thunk } from "easy-peasy";
import { IModalUserInteraction } from ".";
import JSZip from "jszip";

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
