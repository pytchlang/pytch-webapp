import { assert } from "chai";
import * as crypto from "node:crypto";
import { AssetTransform, AssetTransformOps } from "../../src/model/asset/core";
import { hexSHA256 } from "../../src/utils";

globalThis.crypto = globalThis.crypto ?? crypto;

describe("Asset operations", () => {
  describe("content hashing", () => {
    it("hashes non-trivial image transform", async () => {
      const tfm: AssetTransform = {
        targetType: "image",
        originX: 12.5,
        originY: 42.75,
        width: 100,
        height: 33.25,
        scale: 0.625,
      };

      const gotHash = await AssetTransformOps.contentHash(tfm);
      const expFprint = "ImageTransform/1.25e+1/4.275e+1/1e+2/3.325e+1/6.25e-1";
      const expHash = await hexSHA256(expFprint);
      assert.equal(gotHash, expHash);
    });
  });
});
