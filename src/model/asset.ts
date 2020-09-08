// Assets are identified by a hash of their contents.
export type AssetId = string;

export interface IAssetInProject {
  name: string;
  mimeType: string;
  id: AssetId;
}

export interface ImageAssetPresentationData {
  kind: "image";
  image: HTMLImageElement;
}

export interface SoundAssetPresentationData {
  kind: "sound";
  audioBuffer: AudioBuffer | null;
}

type AssetPresentationData =
  | ImageAssetPresentationData
  | SoundAssetPresentationData;
