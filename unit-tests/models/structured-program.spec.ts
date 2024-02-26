import { assert } from "chai";
import {
  UuidOps,
  AssetMetaData,
  AssetMetaDataOps,
  EventDescriptorKindOps,
  EventDescriptor,
  EventDescriptorOps,
  EventHandlerOps,
  ActorOps,
  unusedSpriteName,
  SpriteUpsertionArgs,
  StructuredProgramOps,
  SourceMapEntry,
  SourceMap,
  LocationWithinHandler,
  Uuid,
  PendingCursorWarp,
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

      it("delete existing", () => {
        let sprite = Ops.newEmptySprite("Banana");
        const handler = EventHandlerOps.newWithEmptyCode({ kind: "clicked" });
        Ops.appendHandler(sprite, handler);
        const deletedHandler = Ops.deleteHandlerById(sprite, handler.id);
        assert.equal(deletedHandler, handler);
        assert.equal(sprite.handlers.length, 0);
      });

      it("handles delete of non-existent", () => {
        let sprite = Ops.newEmptySprite("Banana");
        assert.throws(
          () => Ops.deleteHandlerById(sprite, UuidOps.newRandom()),
          "not found in actor"
        );
      });

      it("upsertHandler", () => {
        let program = StructuredProgramOps.newEmpty();
        const bananaId = StructuredProgramOps.addSprite(program, "Banana");
        assert.equal(program.actors.length, 2); // Stage, Banana
        const banana = program.actors[1];

        const eventDescriptor: EventDescriptor = { kind: "clicked" };
        const handlerId = StructuredProgramOps.upsertHandler(program, {
          actorId: bananaId,
          action: { kind: "insert" },
          eventDescriptor,
        });
        assert.equal(banana.handlers.length, 1);
        assert.equal(banana.handlers[0].id, handlerId);
        assert.equal(banana.handlers[0].event.kind, "clicked");

        const updatedId = StructuredProgramOps.upsertHandler(program, {
          actorId: bananaId,
          action: { kind: "update", handlerId, previousEvent: null },
          eventDescriptor: { kind: "green-flag" },
        });
        assert.equal(updatedId, handlerId);
        assert.equal(banana.handlers.length, 1);
        assert.equal(banana.handlers[0].id, handlerId);
        assert.equal(banana.handlers[0].event.kind, "green-flag");
      });

      // This should never happen, if we use the appendHandler() method
      // to build up the handlers array:
      it("handles find handler if duplicate", () => {
        let sprite = Ops.newEmptySprite("Banana");
        const handler = EventHandlerOps.newWithEmptyCode({ kind: "clicked" });
        sprite.handlers.push(handler, handler);
        assert.throws(
          () => Ops.handlerById(sprite, handler.id),
          "found more than once"
        );
      });
    });
  });

  describe("name operations", () => {
    // Only test the parts which don't depend on Skulpt.  There's a TODO
    // to move the Skulpt-dependent parts to pytch-vm.

    it("find an unused Sprite name", () => {
      const existingNames = ["Banana", "Sprite2", "Cat", "Sprite1"];
      const newName = unusedSpriteName(existingNames);
      assert.equal(newName, "Sprite3");
    });
  });

  describe("programs", () => {
    const Ops = StructuredProgramOps;

    const threeSpriteProgramNames = ["Sprite1", "Sprite2", "Sprite4"];
    const threeSpriteProgram = () => {
      let program = Ops.newEmpty();
      threeSpriteProgramNames.forEach((name) => Ops.addSprite(program, name));
      return program;
    };

    it("create an empty program", () => {
      const program = Ops.newEmpty();
      assert.equal(program.actors.length, 1);
      assert.equal(program.actors[0].kind, "stage");
    });

    it("create a simple example", () => {
      const program = Ops.newSimpleExample();
      assert.equal(program.actors.length, 2);
      assert.equal(program.actors[0].kind, "stage");
      assert.equal(program.actors[1].kind, "sprite");
      assert.equal(program.actors[1].handlers.length, 1);
    });

    it("add then find Sprite", () => {
      let program = Ops.newEmpty();
      const addedId = Ops.addSprite(program, "Banana");
      assert.equal(program.actors.length, 2);
      assert.equal(program.actors[1].kind, "sprite");
      const bananaId = program.actors[1].id;
      assert.equal(bananaId, addedId);
      const actor = Ops.uniqueActorById(program, bananaId);
      assert.equal(actor.name, "Banana");
      const summary = Ops.uniqueActorSummaryById(program, bananaId);
      assert.equal(summary.kind, "sprite");
      assert.equal(summary.handlerIds.length, 0);
    });

    it("work with Sprite names", () => {
      let program = threeSpriteProgram();
      const gotNames = Ops.spriteNames(program);
      assert.deepEqual(gotNames, threeSpriteProgramNames);

      assert.isTrue(Ops.hasSpriteByName(program, "Sprite2"));
      assert.isFalse(Ops.hasSpriteByName(program, "Sprite3"));
      assert.isFalse(Ops.hasSpriteByName(program, "Stage"));
    });

    it("rename a Sprite", () => {
      let expNames = threeSpriteProgramNames.slice();
      expNames[0] = "Banana";

      let program = threeSpriteProgram();
      const upsertArgs: SpriteUpsertionArgs = {
        kind: "update",
        actorId: program.actors[1].id,
        previousName: "Sprite1",
        name: "Banana",
      };
      const spriteId = Ops.upsertSprite(program, upsertArgs);

      assert.equal(spriteId, upsertArgs.actorId);

      const gotNames = Ops.spriteNames(program);
      assert.deepEqual(gotNames, expNames);
    });

    it("rejects rename if wrong previousName", () => {
      const program = threeSpriteProgram();
      assert.throws(() => {
        Ops.upsertSprite(program, {
          kind: "update",
          actorId: program.actors[1].id,
          previousName: "Apple",
          name: "Orange",
        });
      }, /expected Actor [^ ]* to have name "Apple"/);
    });

    it("rejects rename if duplicate name", () => {
      const program = threeSpriteProgram();
      assert.throws(() => {
        Ops.upsertSprite(program, {
          kind: "update",
          actorId: program.actors[1].id,
          previousName: "Sprite1",
          name: "Sprite2",
        });
      }, 'already have sprite called "Sprite2"');
    });

    it("delete a Sprite", () => {
      let program = threeSpriteProgram();
      const firstSpriteId = program.actors[1].id;
      const lastSpriteId = program.actors[3].id;

      // Deleting non-last Sprite should give us the next sprite:
      const adjId_1 = Ops.deleteSprite(program, program.actors[2].id);
      assert.equal(adjId_1, lastSpriteId);
      const expSpriteNames_1 = [
        threeSpriteProgramNames[0],
        threeSpriteProgramNames[2],
      ];
      assert.deepEqual(Ops.spriteNames(program), expSpriteNames_1);

      // Deleting last Sprite should give us the previous sprite:
      const adjId_2 = Ops.deleteSprite(program, program.actors[2].id);
      assert.equal(adjId_2, firstSpriteId);
      const expSpriteNames_2 = [threeSpriteProgramNames[0]];
      assert.deepEqual(Ops.spriteNames(program), expSpriteNames_2);
    });

    it("handle Sprite-deletion failures", () => {
      let program = threeSpriteProgram();
      assert.throws(
        () => Ops.deleteSprite(program, "no-such-id"),
        "could not find actor"
      );
      assert.throws(
        () => Ops.deleteSprite(program, program.actors[0].id),
        'should be of kind "sprite"'
      );
    });

    it("find handler", () => {
      let program = threeSpriteProgram();
      ActorOps.appendHandler(
        program.actors[0],
        EventHandlerOps.newWithEmptyCode({ kind: "clicked" })
      );

      let clickedHandlerId = program.actors[0].handlers[0].id;
      let foundHandler = Ops.uniqueHandlerByIdGlobally(
        program,
        clickedHandlerId
      );
      assert.equal(foundHandler.event.kind, "clicked");
    });

    it("detect dupd handler-id", () => {
      let program = threeSpriteProgram();
      const handler = EventHandlerOps.newWithEmptyCode({ kind: "clicked" });
      program.actors[0].handlers.push(handler);
      program.actors[1].handlers.push(handler);
      assert.throws(() => {
        Ops.uniqueHandlerByIdGlobally(program, handler.id);
      }, "multiple handlers with id");
    });
  });

  describe("source map", () => {
    const entries: Array<SourceMapEntry> = [
      { startLine: 10, actorId: "a1", handlerId: "h1" },
      { startLine: 20, actorId: "a1", handlerId: "h2" },
      { startLine: 25, actorId: "a2", handlerId: "h3" },
      { startLine: 35, actorId: "a2", handlerId: "h4" },
      { startLine: 50, actorId: "a3", handlerId: "h5" },
    ];

    function assertLoc(
      gotLocation: LocationWithinHandler,
      expActorId: Uuid,
      expHandlerId: Uuid,
      expLine: number
    ) {
      assert.equal(gotLocation.actorId, expActorId);
      assert.equal(gotLocation.handlerId, expHandlerId);
      assert.equal(gotLocation.lineWithinHandler, expLine);
    }

    it("reject bad entries array", () => {
      let map = new SourceMap();
      assert.throws(
        () => map.setEntries([entries[1], entries[0], ...entries.slice(2)]),
        "must be strictly increasing"
      );
    });

    it("reject when empty", () => {
      const map = new SourceMap();
      assert.throws(() => map.localFromGlobal(42), "before any handler");
    });

    it("find local", () => {
      let map = new SourceMap();
      map.setEntries(entries);

      assertLoc(map.localFromGlobal(10), "a1", "h1", 0);
      assertLoc(map.localFromGlobal(19), "a1", "h1", 9);
      assertLoc(map.localFromGlobal(20), "a1", "h2", 0);
      assertLoc(map.localFromGlobal(27), "a2", "h3", 2);
      assertLoc(map.localFromGlobal(99), "a3", "h5", 49);

      assert.throws(() => map.localFromGlobal(9), "before any handler");
    });
  });

  describe("pending cursor warp", () => {
    it("can set and acquire", () => {
      let pendingWarp = new PendingCursorWarp();

      assert.equal(pendingWarp.acquireIfForHandler("nonsense"), null);
      pendingWarp.set({ handlerId: "h1", lineNo: 42, colNo: 8 });
      assert.equal(pendingWarp.acquireIfForHandler("nonsense"), null);
      const target = pendingWarp.acquireIfForHandler("h1");
      assert.equal(target.handlerId, "h1");
      assert.equal(pendingWarp.acquireIfForHandler("h1"), null);
    });
  });
});
