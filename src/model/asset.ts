import { assetServer } from "../skulpt-connection/asset-server";

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

export class AssetPresentation {
  constructor(
    readonly assetInProject: IAssetInProject,
    public presentation: AssetPresentationData
  ) {}

  public get id(): AssetId {
    return this.assetInProject.id;
  }

  public get name(): string {
    return this.assetInProject.name;
  }

  static async create(assetInProject: IAssetInProject) {
    const assetType = assetInProject.mimeType.split("/")[0];
    let presentation: AssetPresentationData;
    switch (assetType) {
      case "image":
        const image = await assetServer.loadImage(assetInProject.name);
        console.log("AssetPresentation.create():", image);
        presentation = { kind: "image", image };
        break;
      case "audio":
        // TODO:
        // const audioData = await assetServer.loadSoundData(asset.name);
        // const audioBuffer = await audioContext.decodeAudioData(audioData);
        // but where to get an AudioContext?
        const audioBuffer = null;
        presentation = { kind: "sound", audioBuffer };
        break;
      default:
        throw Error(`unknown asset mime major type ${assetType}`);
    }

    return new AssetPresentation(assetInProject, presentation);
  }
}
