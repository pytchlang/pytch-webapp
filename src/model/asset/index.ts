import { assetServer } from "../../skulpt-connection/asset-server";
import {
  type AssetId,
  type IAssetInProject,
  type ImageAssetPresentationData,
  type SoundAssetPresentationData,
} from "./core";

export {
  type AssetId,
  type ImageDimensions,
  type ImageCropSourceDescriptor,
  type ImageCropOutputDescriptor,
  type ImageCropDescriptor,
  type AssetTransform,
  AssetTransformOps,
  type IAssetInProject,
  type ImageAssetPresentationData,
  type SoundAssetPresentationData,
} from "./core";

export type AssetPresentationData =
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
    await assetServer.prepare([assetInProject]);

    const assetType = assetInProject.mimeType.split("/")[0];
    let presentation: AssetPresentationData;
    switch (assetType) {
      case "image": {
        const images = assetServer.loadSourceAndTransformedImages(
          assetInProject.name
        );
        presentation = {
          kind: "image",
          fullSourceImage: images.source,
          image: images.transformed,
        };
        break;
      }
      case "audio": {
        // TODO:
        // const audioData = assetServer.loadSoundData(asset.name);
        // const audioBuffer = await audioContext.decodeAudioData(audioData);
        // but where to get an AudioContext?
        const audioBuffer = null;
        presentation = { kind: "sound", audioBuffer };
        break;
      }
      default:
        throw Error(`unknown asset mime major type ${assetType}`);
    }

    return new AssetPresentation(assetInProject, presentation);
  }
}
