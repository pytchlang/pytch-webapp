import {
  assertSoundNames,
} from "../junior/utils";

context("Alt-arrow reordering of sounds", () => {
  const allSoundNames = [
    "note-1.mp3",
    "note-2.mp3",
    "note-3.mp3",
    "note-4.mp3",
  ];

  const assertPluckedSoundNames = (idxs: Array<number>) =>
    assertSoundNames(
      "sprite",
      idxs.map((i) => allSoundNames[i])
    );
});
