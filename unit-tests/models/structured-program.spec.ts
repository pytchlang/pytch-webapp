import { assert } from "chai";
import {
  UuidOps,
  AssetMetaData,
  AssetMetaDataOps,
  EventDescriptor,
  EventDescriptorKindOps,
  EventDescriptorOps,
  EventHandlerOps,
  ActorOps,
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

    it("common actorId", () => {
      const name_1 = assets[1].name;
      const name_2 = assets[2].name;
      const name_3 = assets[3].name;

      assert.equal(Ops.commonActorIdComponent(name_1, name_2), id1);
      assert.throws(
        () => Ops.commonActorIdComponent(name_2, name_3),
        "have different actorId"
      );
    });

    it("belongs-to-actor predicate", () => {
      const gotBelongs = assets.map(Ops.belongsToActor(id2));
      const expBelongs = [false, false, false, true, true, false];
      assert.deepEqual(gotBelongs, expBelongs);
    });

    it("filter by actor", () => {
      const assetsFor1 = Ops.filterByActor(assets, id1);
      assert.deepEqual(assetsFor1.appearances, [
        { fullPathname: `${id1}/banana.png`, basename: "banana.png" },
        { fullPathname: `${id1}/apple.png`, basename: "apple.png" },
      ]);
      assert.deepEqual(assetsFor1.sounds, [
        { fullPathname: `${id1}/whoosh.mp3`, basename: "whoosh.mp3" },
      ]);

      const assetsFor3 = Ops.filterByActor(assets, id3);
      assert.equal(assetsFor3.sounds.length, 0);
    });
  });

  describe("event handlers", () => {
    const KindOps = EventDescriptorKindOps;
    const DescrOps = EventDescriptorOps;
    const HandlerOps = EventHandlerOps;

    const greenFlag: EventDescriptor = { kind: "green-flag" };
    const keyPressed: EventDescriptor = { kind: "key-pressed", keyName: "b" };
    const msgReceived: EventDescriptor = {
      kind: "message-received",
      message: "hello-world",
    };
    const startAsClone: EventDescriptor = { kind: "start-as-clone" };
    const clicked: EventDescriptor = { kind: "clicked" };

    it("event-kind arity", () => {
      assert.equal(KindOps.arity("green-flag"), 0);
      assert.equal(KindOps.arity("key-pressed"), 1);
      assert.equal(KindOps.arity("message-received"), 1);
      assert.equal(KindOps.arity("start-as-clone"), 0);
      assert.equal(KindOps.arity("clicked"), 0);
    });

    it("decorator", () => {
      assert.equal(
        DescrOps.decorator(greenFlag),
        "@pytch.when_green_flag_clicked"
      );
      assert.equal(
        DescrOps.decorator(keyPressed),
        '@pytch.when_key_pressed("b")'
      );
      assert.equal(
        DescrOps.decorator(msgReceived),
        '@pytch.when_I_receive("hello-world")'
      );
      assert.equal(
        DescrOps.decorator(startAsClone),
        "@pytch.when_I_start_as_a_clone"
      );
      assert.equal(
        DescrOps.decorator(clicked),
        "@pytch.when_this_sprite_clicked"
      );
    });

    it("create new handlers", () => {
      const handler = HandlerOps.newWithEmptyCode(greenFlag);
      assert.equal(handler.pythonCode, "");
      assert.equal(handler.event.kind, "green-flag");
    });
  });

  describe("actors", () => {
    const Ops = ActorOps;

    it("create new Stage", () => {
      const stage = Ops.newEmptyStage();
      assert.equal(stage.kind, "stage");
      assert.equal(stage.handlers.length, 0);
      assert.equal(stage.name, "Stage");
    });

    it("create new Sprite", () => {
      const sprite = Ops.newEmptySprite("Banana");
      assert.equal(sprite.kind, "sprite");
      assert.equal(sprite.handlers.length, 0);
      assert.equal(sprite.name, "Banana");
    });

    describe("handlers", () => {
      it("append, rejecting dup", () => {
        let sprite = Ops.newEmptySprite("Banana");
        const handler = EventHandlerOps.newWithEmptyCode({ kind: "clicked" });
        Ops.appendHandler(sprite, handler);
        assert.equal(sprite.handlers.length, 1);
        assert.throws(
          () => Ops.appendHandler(sprite, handler),
          "already has a handler"
        );
      });
    });
  });
});
