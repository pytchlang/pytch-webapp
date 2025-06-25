import { AssetNameAndType } from "../../src/database/indexed-db";
import {
  ActorOps,
  EventDescriptor,
  EventHandlerOps,
  StructuredProgram,
  StructuredProgramOps,
  UuidOps,
} from "../../src/model/junior/structured-program";

export const threeSpriteProgramNames = ["Sprite1", "Sprite2", "Sprite4"];

export const threeSpriteProgram = () => {
  let program = StructuredProgramOps.newEmpty();
  threeSpriteProgramNames.forEach((name) =>
    StructuredProgramOps.addSprite(program, name)
  );
  return program;
};

export const threeSpriteMultiHandlerProgram = () => {
  const eventDescrs: Array<EventDescriptor> = [
    { kind: "green-flag" },
    { kind: "clicked" },
    { kind: "message-received", message: "jump-up-and-down" },
    { kind: "start-as-clone" },
  ];

  let program = threeSpriteProgram();
  for (let actor of program.actors) {
    for (const eventDescr of eventDescrs) {
      ActorOps.appendHandler(
        actor,
        EventHandlerOps.newWithEmptyCode(eventDescr)
      );
    }
  }

  return program;
};

type AssetOrderingData = {
  assets: Array<AssetNameAndType>;
  expIndexes: Array<number>;
};

export const assetOrderingData = (
  program: StructuredProgram
): AssetOrderingData => {
  const ids = program.actors.map((actor) => actor.id);
  const badId = UuidOps.newRandom();

  const names = [
    `${badId}/0000.jpg` /*  0 */,
    `${badId}/0001.mp3` /*  1 */,
    `${ids[0]}/0-0.jpg` /*  2 */,
    `${ids[1]}/1-0.jpg` /*  3 */,
    `${ids[3]}/3-0.jpg` /*  4 */,
    `${ids[2]}/2-0.jpg` /*  5 */,
    `${ids[3]}/3-1.jpg` /*  6 */,
    `${badId}/0002.jpg` /*  7 */,
    `${ids[0]}/0-1.jpg` /*  8 */,
    `${ids[1]}/1-1.jpg` /*  9 */,
    `${ids[1]}/1-0.mp3` /* 10 */,
    `${ids[1]}/1-1.mp3` /* 11 */,
    `${ids[1]}/1-2.jpg` /* 12 */,
    `${ids[3]}/3-2.jpg` /* 13 */,
    `${ids[0]}/0-2.jpg` /* 14 */,
    `${badId}/0003.jpg` /* 15 */,
    `${badId}/0004.mp3` /* 16 */,
  ];
  const assets = names.map((name) => ({
    name,
    mimeType: name.endsWith("jpg") ? "image/jpeg" : "audio/mpeg",
  }));

  const expIndexes = [2, 8, 14, 3, 9, 12, 10, 11, 5, 4, 6, 13];

  return { assets, expIndexes };
};
