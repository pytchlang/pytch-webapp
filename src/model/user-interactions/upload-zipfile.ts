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
