import JSZip from "jszip";
import * as MimeTypes from "mime-types";
import { AddAssetDescriptor, assetData } from "../database/indexed-db";
import { AssetTransform } from "../model/asset";
import { StoredProjectContent } from "../model/project";
import { envVarOrFail, failIfNull } from "../utils";

// This is the same as IAddAssetDescriptor; any way to avoid this
// duplication?
type RawAssetDescriptor = Omit<AddAssetDescriptor, "transform">;

type AssetTransformRecord = { name: string; transform: AssetTransform };

// TODO: Be stricter about this, by checking there are no properties
// besides the expected ones.
const _isAssetTransform = (x: any): x is AssetTransform => {
  switch (x.targetType) {
    case "image":
      for (const prop of ["originX", "originY", "width", "height", "scale"]) {
        if (typeof x[prop] !== "number") {
          return false;
        }
      }
      break;
    case "audio":
      // Currently no properties to check.
      break;
    default:
      return false;
  }
  return true;
};

const _isAssetTransformRecord = (x: any): x is AssetTransformRecord => {
  return typeof x.name === "string" && _isAssetTransform(x.transform);
};

const _isAssetTransformRecordArray = (
  x: any
): x is Array<AssetTransformRecord> => {
  return Array.isArray(x) && x.every(_isAssetTransformRecord);
};

// Error machinery is a bit fiddly.  Sometimes we throw an error in the
// middle of a sequence of steps which might throw errors themselves.
// In that case, we do so in a try/catch, and in the "catch", we rethrow
// the error after wrapping in something a bit more friendly.  In other
// cases, we explicitly wrap the error at the point of throwing it.

type ErrorTransformation = (err: Error) => Error;

const bareError: ErrorTransformation = (err: Error): Error => err;

export const wrappedError: ErrorTransformation = (err: Error): Error => {
  return new Error(
    `There was a problem with the zipfile.  (Technical details: ${err}.)`
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
): Promise<RawAssetDescriptor> => {
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
  assets: Array<AddAssetDescriptor>;
};

const parseZipfile_V1 = async (
  zip: JSZip,
  zipName?: string
): Promise<ProjectDescriptor> => {
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

  let assetPromises: Array<Promise<RawAssetDescriptor>> = [];
  assetsZip.forEach((path, zipObj) =>
    assetPromises.push(_zipAsset(path, zipObj))
  );

  const assets = await Promise.all(assetPromises);

  const summary =
    zipName == null ? undefined : `Created from zipfile "${zipName}"`;

  return { name: projectName, summary, codeText, assets };
};

const parseZipfile_V2 = async (
  zip: JSZip,
  zipName?: string
): Promise<ProjectDescriptor> => {
  const codeZipObj = _zipObjOrFail(zip, "code/code.py", bareError);
  const codeText = await codeZipObj.async("text");

  const projectMetadata = await _jsonOrFail(zip, "meta.json", bareError);
  const projectName = failIfNull(
    projectMetadata.projectName,
    "could not find project name in metadata"
  );
  if (typeof projectName !== "string")
    throw new Error("project name is not a string");

  const assetMetadataPath = "assets/metadata.json";
  const assetMetadata = await _jsonOrFail(zip, assetMetadataPath, bareError);
  if (!_isAssetTransformRecordArray(assetMetadata))
    throw new Error(
      `"${assetMetadataPath}" does not hold an array of transform records`
    );

  const transformFromName = new Map<string, AssetTransform>(
    assetMetadata.map((x) => [x.name, x.transform])
  );

  const assetsZip = failIfNull(
    zip.folder("assets/files"),
    `could not enter folder "assets/files" of zipfile`
  );

  let assetPromises: Array<Promise<RawAssetDescriptor>> = [];
  assetsZip.forEach((path, zipObj) =>
    assetPromises.push(_zipAsset(path, zipObj))
  );

  const rawAssets = await Promise.all(assetPromises);
  const assets: Array<AddAssetDescriptor> = rawAssets.map((a) => ({
    ...a,
    transform: transformFromName.get(a.name),
  }));

  const summary =
    zipName == null ? undefined : `Created from zipfile "${zipName}"`;

  return { name: projectName, summary, codeText, assets };
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
        return await parseZipfile_V1(zip, zipName);
      } catch (err) {
        throw wrappedError(err as Error);
      }
    // No "break" needed; we've either returned or thrown by now.
    case 2:
      try {
        return await parseZipfile_V2(zip, zipName);
      } catch (err) {
        throw wrappedError(err as Error);
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

const pytchZipfileVersion = 2;
export const zipfileDataFromProject = async (
  project: StoredProjectContent
): Promise<Uint8Array> => {
  const zipFile = new JSZip();
  zipFile.file("version.json", JSON.stringify({ pytchZipfileVersion }));

  // TODO: Include project summary?
  // TODO: Preserve info on whether tracking tutorial?
  const projectName = project.name;
  const metaData = { projectName };
  zipFile.file("meta.json", JSON.stringify(metaData));

  zipFile.file("code/code.py", project.codeText);

  // Ensure folder exists, even if there are no assets.
  zipFile.folder("assets")!.folder("files");
  await Promise.all(
    project.assets.map(async (asset) => {
      // TODO: Once we're able to delete assets, the following might fail:
      const data = await assetData(asset.id);
      zipFile.file(`assets/files/${asset.name}`, data);
    })
  );

  const assetMetadataJSON = JSON.stringify(
    project.assets.map((a) => ({
      name: a.name,
      transform: a.assetInProject.transform,
    }))
  );

  zipFile.file(`assets/metadata.json`, assetMetadataJSON);

  return await zipFile.generateAsync({ type: "uint8array" });
};

const demosDataRoot = envVarOrFail("REACT_APP_DEMOS_BASE");

export const demoURLFromId = (id: string): string =>
  [demosDataRoot, `${id}.zip`].join("/");
