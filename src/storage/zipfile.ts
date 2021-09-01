import JSZip from "jszip";
import * as MimeTypes from "mime-types";

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
  const versionInfo = await _jsonOrFail(zip, "version.json", wrappedError);
  const maybeVersion = versionInfo.pytchZipfileVersion;
  if (maybeVersion == null)
    throw wrappedError(
      new Error("version object does not contain pytchZipfileVersion property")
    );
  return maybeVersion;
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

const _loadZipOrFail = async (zipData: ArrayBuffer): Promise<JSZip> => {
  try {
    return await JSZip.loadAsync(zipData);
  } catch (err) {
    throw wrappedError(new Error("File does not seem to be a zipfile"));
  }
};
