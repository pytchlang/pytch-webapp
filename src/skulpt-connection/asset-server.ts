import { assetData } from "../database/indexed-db";
import { IAssetInProject } from "../model/asset";

declare var Sk: any;

// TODO: Does this whole file belong in "database"?

enum AssetKind {
  Image,
  Sound,
}

type ImageAsset = {
  kind: AssetKind.Image;
  image: HTMLImageElement;
};

type SoundAsset = {
  kind: AssetKind.Sound;
  audioData: ArrayBuffer;
};

type Asset = ImageAsset | SoundAsset;

// Initial implementation re-fetches all assets every time.

class AssetServer {
  assetByName: Map<string, Promise<Asset>>;

  constructor() {
    this.assetByName = new Map<string, Promise<Asset>>();
  }

  rawLoadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(img);
      // TODO: Anything useful for img.onerror?
      img.src = url;
    });
  }

  async fetchAsset(asset: IAssetInProject): Promise<Asset> {
    const data = await assetData(asset.id);
    const mimeTopLevelType = asset.mimeType.split("/")[0];
    switch (mimeTopLevelType) {
      // TODO: Should check that we only ever create assets
      // with these mime top-level types:
      case "image": {
        const blob = new Blob([data], { type: asset.mimeType });

        const dataUrl = URL.createObjectURL(blob);
        const image = await this.rawLoadImage(dataUrl);

        // TODO: Work out when to revoke this URL.  We need it for creation of
        // the asset thumbnail as well as the images for use in project
        // rendering.  We have to keep the URL non-revoked as long as we might
        // want to create images from
        // it.

        return {
          kind: AssetKind.Image,
          image: image,
        };
      }
      case "audio": {
        return {
          kind: AssetKind.Sound,
          audioData: data,
        };
      }
      default:
        throw Error(
          `unknown top-level mime type ${mimeTopLevelType}` +
            ` for asset "${asset.name}" with id ${asset.id}`
        );
    }
  }

  prepare(assets: Array<IAssetInProject>) {
    this.assetByName.clear();
    assets.forEach((asset) => {
      this.assetByName.set(asset.name, this.fetchAsset(asset));
    });
  }

  async clear() {
    const revokeURLIfImage = async (assetPromise: Promise<Asset>) => {
      const asset = await assetPromise;
      if (asset.kind === AssetKind.Image) {
        console.log("revoking", asset.image.src);
        URL.revokeObjectURL(asset.image.src);
      }
    };

    await Promise.all(
      Array.from(this.assetByName.values()).map(revokeURLIfImage)
    );
  }

  async assetOfKind(name: string, kind: AssetKind, kindTag: string) {
    const asset = await this.assetByName.get(name);
    if (asset == null) {
      throw new Sk.pytchsupport.PytchAssetLoadError(
        `no asset-promise for ${name}`
      );
    }
    if (asset.kind !== kind) {
      throw Error(
        `asset for "${name}" was ${asset.kind}` +
          ` but expecting ${kind}("${kindTag}")`
      );
    }
    return asset;
  }

  async loadImage(name: string): Promise<HTMLImageElement> {
    const asset = await this.assetOfKind(name, AssetKind.Image, "Image");
    return (asset as ImageAsset).image;
  }

  async loadSoundData(name: string): Promise<ArrayBuffer> {
    const asset = await this.assetOfKind(name, AssetKind.Sound, "Sound");
    return (asset as SoundAsset).audioData;
  }
}

export const assetServer = new AssetServer();
