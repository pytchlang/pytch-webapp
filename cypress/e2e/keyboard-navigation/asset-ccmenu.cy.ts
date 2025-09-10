import {
  focusActorAssetViaMouse,
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";
import {
  assertCopiedText,
} from "../utils";
import { assertFocus, chooseCcMenuItem } from "./utils";

context("Asset-card ccmenu", () => {
  beforeEach(() => {
    loadFromZipfile("eight-grey-costumes.zip");
    selectSprite("GreyThing");
    selectActorAspect("Costumes");
  });

  it("copy name", () => {
    focusActorAssetViaMouse(3);
    chooseCcMenuItem(0);
    assertCopiedText("'solid-003.png'");
    assertFocus("appearance-card", 3);
  });
});
