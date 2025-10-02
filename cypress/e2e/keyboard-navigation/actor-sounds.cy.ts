import {
  assertSoundNames,
  focusActorAssetViaMouse,
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";
import {
  assertFocus,
  kAltArrowDown,
  kAltArrowLeft,
  kAltArrowRight,
  realPress,
} from "./utils";

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

  it("reorder sounds", () => {
    loadFromZipfile("four-sounds.zip");
    selectSprite("Button");
    selectActorAspect("Sounds");

    focusActorAssetViaMouse(0);
    assertFocus("sound-card", 0);
    assertPluckedSoundNames([0, 1, 2, 3]);

    realPress(kAltArrowDown);
    assertFocus("sound-card", 1);
    assertPluckedSoundNames([1, 0, 2, 3]);

    realPress("ArrowDown");
    realPress(kAltArrowRight);
    assertFocus("sound-card", 3);
    assertPluckedSoundNames([1, 0, 3, 2]);

    realPress(kAltArrowDown);
    assertFocus("sound-card", 3);
    assertPluckedSoundNames([1, 0, 3, 2]);

    realPress(kAltArrowLeft);
    assertFocus("sound-card", 2);
    assertPluckedSoundNames([1, 0, 2, 3]);
  });
});
