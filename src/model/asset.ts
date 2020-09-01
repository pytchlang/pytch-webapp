// Assets are identified by a hash of their contents.
export type AssetId = string;

export interface IAssetInProject {
  name: string;
  mimeType: string;
  id: AssetId;
}
