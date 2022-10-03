import { assetData } from "../database/indexed-db";
import { IAssetInProject, ImageCropDescriptor } from "../model/asset";

declare var Sk: any;

// TODO: Does this whole file belong in "database"?

enum AssetKind {
  Image,
  Sound,
}

type ImageAsset = {
  kind: AssetKind.Image;
  image: HTMLImageElement;
  fullSourceImage: HTMLImageElement;
};

type SoundAsset = {
  kind: AssetKind.Sound;
  audioData: ArrayBuffer;
};

type Asset = ImageAsset | SoundAsset;

// Initial implementation re-fetches all assets every time.

/**
 * AssetServer: Object which provides images and sounds to a client.
 *
 * Used as a singleton, via the global instance `assetServer` defined
 * below.
 *
 * Each time a new project is activated, that project's assets are
 * loaded into the server via `prepare()`.  This method is also used
 * when a new asset is added to a project.  The actual asset data is
 * loaded from the IndexedDB store, keyed by asset-ID.
 *
 * To discard all stored assets from the asset-server, the `clear()`
 * method is used.  This is done as a preparatory step when syncing all
 * assets of a project into the React state, and also when deactivating
 * a project.
 *
 * The `loadImage()` and `loadSoundData()` methods provide access to
 * assets which have been loaded into the server via `prepare()`.
 */
class AssetServer {
  assetByName: Map<string, Asset>;

  constructor() {
    this.assetByName = new Map<string, Asset>();
  }

  private rawLoadImage(name: string, url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (_err: any) =>
        reject(new Error(`problem creating image for "${name}"`));
      img.src = url;
    });
  }

  private async transformImage(
    sourceImage: HTMLImageElement,
    sourceName: string,
    transform: ImageCropDescriptor
  ): Promise<HTMLImageElement> {
    const pxFromX = (x: number): number => Math.round(x * sourceImage.width);
    const pxFromY = (y: number): number => Math.round(y * sourceImage.height);

    const pxOriginX = pxFromX(transform.originX);
    const pxOriginY = pxFromY(transform.originY);
    const pxWidth = pxFromX(transform.width);
    const pxHeight = pxFromY(transform.height);

    const pxOutputWidth = Math.max(1, Math.round(transform.scale * pxWidth));
    const pxOutputHeight = Math.max(1, Math.round(transform.scale * pxHeight));

    const canvas = document.createElement("canvas");
    canvas.width = pxOutputWidth;
    canvas.height = pxOutputHeight;

    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      throw new Error("could not get 2d context of canvas");
    }

    // Not all browsers take notice of this, but some do, so we may as
    // well take what we can get:
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      sourceImage,
      pxOriginX,
      pxOriginY,
      pxWidth,
      pxHeight,
      0,
      0,
      pxOutputWidth,
      pxOutputHeight
    );

    const dataURL = canvas.toDataURL();
    return await this.rawLoadImage(sourceName, dataURL);
  }

  private async fetchAsset(asset: IAssetInProject): Promise<Asset> {
    const data = await assetData(asset.id);
    const mimeTopLevelType = asset.mimeType.split("/")[0];
    switch (mimeTopLevelType) {
      // TODO: Should check that we only ever create assets
      // with these mime top-level types:
      case "image": {
        const blob = new Blob([data], { type: asset.mimeType });

        // The ObjectURL we create here is revoked in clear().
        const dataUrl = URL.createObjectURL(blob);
        const sourceImage = await this.rawLoadImage(asset.name, dataUrl);

        const transformTargetType = asset.transform.targetType;
        if (transformTargetType !== "image")
          throw new Error(
            `asset is of type "image" but` +
              ` transform has target type "${transformTargetType}"`
          );

        const image = await this.transformImage(
          sourceImage,
          asset.name,
          asset.transform
        );

        return {
          kind: AssetKind.Image,
          image: image,
          fullSourceImage: sourceImage,
        };
      }
      case "audio": {
        // TODO: Audio transform?
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

  /** Ensure all the given assets are available for access via
   * `loadImage()` or `loadSoundData()` as appropriate.  Actual asset
   * data is pulled from the IndexedDB storage.  The returned Promise
   * resolves (with `void`) when all assets are available.
   */
  async prepare(assets: Array<IAssetInProject>) {
    await Promise.all(
      assets.map(async (asset) => {
        this.assetByName.set(asset.name, await this.fetchAsset(asset));
      })
    );
  }

  /** Discard all stored assets. */
  clear() {
    const revokeURLIfImage = (asset: Asset) => {
      if (asset.kind === AssetKind.Image) {
        console.log("revoking", asset.image.src);
        URL.revokeObjectURL(asset.image.src);
      }
    };

    Array.from(this.assetByName.values()).forEach(revokeURLIfImage);
    this.assetByName.clear();
  }

  private assetOfKind(name: string, kind: AssetKind.Image): ImageAsset;
  private assetOfKind(name: string, kind: AssetKind.Sound): SoundAsset;
  private assetOfKind(name: string, kind: AssetKind) {
    const kindName = AssetKind[kind];
    const asset = this.assetByName.get(name);
    if (asset == null) {
      throw new Sk.pytchsupport.PytchAssetLoadError({
        kind: AssetKind[kind],
        path: name,
        message: "no file with that name",
      });
    }
    if (asset.kind !== kind) {
      const gotKindName = AssetKind[asset.kind];
      throw new Sk.pytchsupport.PytchAssetLoadError({
        kind: kindName,
        path: name,
        message:
          `asset for "${name}" is of kind "${gotKindName}"` +
          ` but was expecting kind "${kindName}")`,
      });
    }
    return asset;
  }

  /** Return an image corresponding to the given asset name. */
  loadImage(name: string): HTMLImageElement {
    const asset = this.assetOfKind(name, AssetKind.Image);
    return asset.image;
  }

  /** Return sound data corresponding to the given asset name. */
  loadSoundData(name: string): ArrayBuffer {
    const asset = this.assetOfKind(name, AssetKind.Sound);
    return (asset as SoundAsset).audioData;
  }
}

export const assetServer = new AssetServer();
