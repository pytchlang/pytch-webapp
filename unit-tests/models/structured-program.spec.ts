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

    it("find matching", () => {
      assert.equal(
        Ops.firstMatching(assets, id1, "image").name,
        `${id1}/banana.png`
      );

      assert.equal(
        Ops.firstMatching(assets, id1, "audio").name,
        `${id1}/whoosh.mp3`
      );

      assert.equal(
        Ops.firstMatching(assets, id2, "image").name,
        `${id2}/face.jpg`
      );

      assert.equal(Ops.firstMatching(assets, id3, "audio"), null);
      assert.equal(Ops.firstMatching(assets, id4, "image"), null);
      assert.equal(Ops.firstMatching(assets, id4, "audio"), null);
    });

    it("destructure path", () => {
      const name = assets[0].name;

      const parts = Ops.pathComponents(name);
      assert.equal(parts.actorId, id1);
      assert.equal(parts.basename, "banana.png");

      assert.equal(Ops.actorId(name), id1);
      assert.equal(Ops.basename(name), "banana.png");
    });
  });
});
