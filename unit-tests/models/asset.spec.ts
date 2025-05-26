import { assert } from "chai";
import * as crypto from "node:crypto";
import { AssetTransform, AssetTransformOps } from "../../src/model/asset/core";
import { hexSHA256 } from "../../src/utils";
import {
  AssetMetaData,
  AssetMetaDataOps,
  AssetMimeType,
  Uuid,
  UuidOps,
} from "../../src/model/junior/structured-program";

globalThis.crypto = globalThis.crypto ?? crypto;

describe("Asset operations", () => {
  describe("mime-type operations", () => {
    const Ops = AssetMetaDataOps;

    it("mime-major-type", () => {
      assert.equal(Ops.mimeMajorType("TEXT/plain;"), "text");
      assert.equal(
        Ops.mimeMajorType("multipart/form-data;boundary=a"),
        "multipart"
      );
      assert.throws(() => Ops.mimeMajorType("blah;blah"), "could not parse");
    });

    it("mime-major-type sort key", () => {
      assert.equal(Ops.mimeMajorTypeSortKey("image"), 0);
      assert.equal(Ops.mimeMajorTypeSortKey("audio"), 1);
      assert.throws(() => Ops.mimeMajorTypeSortKey("text"), "unknown");
    });

    it("asset mime-type", () => {
      assert.equal(Ops.mimeAssetKind("image/png"), "image");
      assert.equal(Ops.mimeAssetKind("audio/mpeg"), "audio");
      assert.throws(() => Ops.mimeAssetKind("text/plain"), "not suitable");
    });

    it("filterByActorMimeType", () => {
      const mkImage = (actor: string, stem: string) => ({
        name: `${actor}/${stem}.png`,
        assetInProject: { mimeType: "image/png" },
      });
      const mkAudio = (actor: string, stem: string) => ({
        name: `${actor}/${stem}.wav`,
        assetInProject: { mimeType: "audio/wav" },
      });

      const a1 = UuidOps.newRandom();
      const a2 = UuidOps.newRandom();
      const assets: Array<AssetMetaData> = [
        mkImage(a1, "image-1"),
        mkImage(a1, "image-2"),
        mkAudio(a1, "sound-1"),
        mkAudio(a1, "sound-2"),
        mkImage(a2, "image-1"),
        mkImage(a2, "image-2"),
        mkAudio(a2, "sound-1"),
        mkAudio(a2, "sound-2"),
      ];

      const assertCorrect = (
        actor: Uuid,
        mtype: AssetMimeType,
        expected: Array<AssetMetaData>
      ) => {
        const got = Ops.filterByActorMimeType(assets, actor, mtype);
        assert.deepEqual(got, expected);
      };

      assertCorrect(a1, "image", [
        mkImage(a1, "image-1"),
        mkImage(a1, "image-2"),
      ]);
      assertCorrect(a1, "audio", [
        mkAudio(a1, "sound-1"),
        mkAudio(a1, "sound-2"),
      ]);
      assertCorrect(a2, "image", [
        mkImage(a2, "image-1"),
        mkImage(a2, "image-2"),
      ]);
      assertCorrect(a2, "audio", [
        mkAudio(a2, "sound-1"),
        mkAudio(a2, "sound-2"),
      ]);
    });
  });

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

    it("hashes (necessarily trivial) audio transform", async () => {
      const tfm: AssetTransform = { targetType: "audio" };
      const gotHash = await AssetTransformOps.contentHash(tfm);
      const expHash = await hexSHA256("");
      assert.equal(gotHash, expHash);
    });
  });
});
