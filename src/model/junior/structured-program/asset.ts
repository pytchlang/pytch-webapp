import { Uuid } from "./core-types";

// Compatible with AssetPresentation
export interface AssetMetaData {
  name: string;
  assetInProject: { mimeType: string };
}

type AssetNames = { fullPathname: string; basename: string };

type AssetNamesByKind = {
  appearances: Array<AssetNames>;
  sounds: Array<AssetNames>;
};

export type AssetPathComponents = {
  actorId: Uuid;
  basename: string;
};

// TODO: Tighten regexp?
const dirnameBasenameRegExp = new RegExp("^([0-9a-f-]{36})/(.*)");

export class AssetMetaDataOps {
  /** Return the first asset within `allAssets` which belongs to the
   * given `targetActorId` and is of the given `targetMimeMajorType`
   * (e.g., `"image"`).  If there is no such asset, return `null`. */
  static firstMatching<T extends AssetMetaData>(
    allAssets: Array<T>,
    targetActorId: Uuid,
    targetMimeMajorType: string
  ): T | null {
    const actorPathPrefix = `${targetActorId}/`;
    const mimeTypePrefix = `${targetMimeMajorType}/`;

    const actorAssetsOfType = allAssets.filter(
      (a) =>
        a.name.startsWith(actorPathPrefix) &&
        a.assetInProject.mimeType.startsWith(mimeTypePrefix)
    );

    return actorAssetsOfType.length === 0 ? null : actorAssetsOfType[0];
  }

  /** Split the given `fullPathname` into the "directory" part, which
   * holds the `actorId`, and the "filename" part, which holds the
   * `basename` . */
  static pathComponents(fullPathname: string): AssetPathComponents {
    const maybeMatch = dirnameBasenameRegExp.exec(fullPathname);
    if (maybeMatch == null) {
      throw new Error(`could not parse "${fullPathname}"`);
    }

    return { actorId: maybeMatch[1], basename: maybeMatch[2] };
  }

  /** Return the common `actorId` (i.e., "directory") component of the
   * two given full pathnames `fullPathname_0` and `fullPathname_1`.  If
   * those two pathnames do not have equal `actorId` components, throw
   * an error.
   * */
  static commonActorIdComponent(
    fullPathname_0: string,
    fullPathname_1: string
  ): string {
    const actorId_0 = AssetMetaDataOps.pathComponents(fullPathname_0).actorId;
    const actorId_1 = AssetMetaDataOps.pathComponents(fullPathname_1).actorId;

    if (actorId_0 !== actorId_1)
      throw new Error(
        `"${fullPathname_0}" and "${fullPathname_1}"` +
          " have different actorId components"
      );

    return actorId_0;
  }

  /** Return the `basename` (i.e., "filename") component of the given
   * `fullPathname`. */
  static basename(fullPathname: string): string {
    return AssetMetaDataOps.pathComponents(fullPathname).basename;
  }

  /** Return the `actorId` (i.e., "directory") component of the given
   * `fullPathname`. */
  static actorId(fullPathname: string): string {
    return AssetMetaDataOps.pathComponents(fullPathname).actorId;
  }

  /** Given an `actorId`, return a function which returns `true`/`false`
   * according to whether a given `fullPathname` has a "directory" part
   * equal to that `actorId`.  This corresponds to the asset with that
   * `fullPathname` "belonging to" the actor with that `actorId`. */
  static nameBelongsToActor(actorId: Uuid) {
    return (fullPathname: string) =>
      AssetMetaDataOps.actorId(fullPathname) === actorId;
  }

  /** Given an `actorId`, return a function which returns `true`/`false`
   * according to whether a given `AssetMetaData` value has a `name`
   * with "directory" part equal to that `actorId`.  This corresponds to
   * the asset with that metadata "belonging to" the actor with that
   * `actorId`. */
  static belongsToActor(actorId: Uuid) {
    const nameBelongsToActor = AssetMetaDataOps.nameBelongsToActor(actorId);
    return (asset: AssetMetaData) => nameBelongsToActor(asset.name);
  }
}
