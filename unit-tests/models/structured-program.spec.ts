import { assert } from "chai";
import {
  UuidOps,
  AssetMetaData,
  AssetMetaDataOps,
} from "../../src/model/junior/structured-program";

describe("Structured programs", () => {
  describe("uuids", () => {
    const Ops = UuidOps;

    it("work with Uuids", () => {
      const xs = [Ops.newRandom(), Ops.newRandom(), Ops.newRandom()];
      const ys = xs.slice(0, 3);

      assert.isFalse(ys === xs);
      assert.isTrue(Ops.eqArrays(ys, xs));
      assert.isFalse(Ops.eqArrays(xs.slice(0, 2), xs));

      let zs = xs.slice(0, 3);
      zs[2] = Ops.newRandom();
      assert.isFalse(Ops.eqArrays(zs, xs));
    });
  });

  describe("asset metadata", () => {
    const Ops = AssetMetaDataOps;

    const id1 = UuidOps.newRandom();
    const id2 = UuidOps.newRandom();
    const id3 = UuidOps.newRandom();
    const id4 = UuidOps.newRandom();
    const assets: Array<AssetMetaData> = [
      { name: `${id1}/banana.png`, assetInProject: { mimeType: "image/png" } },
      { name: `${id1}/apple.png`, assetInProject: { mimeType: "image/png" } },
      { name: `${id1}/whoosh.mp3`, assetInProject: { mimeType: "audio/mpeg" } },
      { name: `${id2}/splash.mp3`, assetInProject: { mimeType: "audio/mpeg" } },
      { name: `${id2}/face.jpg`, assetInProject: { mimeType: "image/jpeg" } },
      { name: `${id3}/ball.jpg`, assetInProject: { mimeType: "image/jpeg" } },
    ];
  });
});
