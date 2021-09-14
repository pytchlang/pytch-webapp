import JSZip from "jszip";
import * as MimeTypes from "mime-types";
import { failIfNull } from "../utils";

// This is the same as IAddAssetDescriptor; any way to avoid this
// duplication?
export interface AssetDescriptor {
  name: string;
  mimeType: string;
  data: ArrayBuffer;
}

// Error machinery is a bit fiddly.  Sometimes we throw an error in the
// middle of a sequence of steps which might throw errors themselves.
// In that case, we do so in a try/catch, and in the "catch", we rethrow
// the error after wrapping in something a bit more friendly.  In other
// cases, we explicitly wrap the error at the point of throwing it.

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
): Promise<AssetDescriptor> => {
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

// TODO: Would it be meaningful to create a tutorial-tracking project
// from a zipfile?
export type ProjectDescriptor = {
  name: string;
  summary?: string;
  codeText: string;
  assets: Array<AssetDescriptor>;
};

export const projectDescriptor = async (
  zipName: string | undefined,
  zipData: ArrayBuffer
): Promise<ProjectDescriptor> => {
  const zip = await _loadZipOrFail(zipData);
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

        let assetPromises: Array<Promise<AssetDescriptor>> = [];
        assetsZip.forEach((path, zipObj) =>
          assetPromises.push(_zipAsset(path, zipObj))
        );

        const assets = await Promise.all(assetPromises);

        const summary =
          zipName == null ? undefined : `Created from zipfile "${zipName}"`;

        return { name: projectName, summary, codeText, assets };
      } catch (err) {
        throw wrappedError(err);
      }
    // No "break" needed; we've either returned or thrown by now.
    default:
      throw wrappedError(
        new Error(`unhandled Pytch zipfile version ${versionNumber}`)
      );
  }
};

export const projectDescriptorFromURL = async (
  url: string
): Promise<ProjectDescriptor> => {
  const rawResp = await fetch(url);
  const data = await rawResp.arrayBuffer();
  return projectDescriptor(undefined, data);
};

const demosDataRoot = failIfNull(
  process.env.REACT_APP_DEMOS_BASE,
  "must set REACT_APP_DEMOS_BASE env.var"
);

export const demoURLFromId = (id: string): string =>
  [demosDataRoot, `${id}.zip`].join("/");
