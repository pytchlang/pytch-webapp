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
}
