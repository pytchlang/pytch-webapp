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
