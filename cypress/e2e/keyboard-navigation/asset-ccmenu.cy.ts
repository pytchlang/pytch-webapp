import {
  focusActorAssetViaMouse,
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
  settleModalDialog,
} from "../junior/utils";
import {
  assertCopiedText,
  assertModalWithTitle,
} from "../utils";
import { assertFocus, chooseCcMenuItem, realPress } from "./utils";

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

  [
    {
      label: "cxl",
      settle: () => {
        realPress("Escape");
      },
    },
    {
      label: "OK",
      settle: () => {
        settleModalDialog("OK");
      },
    },
  ].forEach((spec) =>
    it(`launch and settle (${spec.label}) crop/scale`, () => {
      focusActorAssetViaMouse(3);
      realPress("ArrowRight", 2);
      chooseCcMenuItem(1);
      assertModalWithTitle("Adjust image");
      spec.settle();
      assertFocus("appearance-card", 5);
    })
  );

  function launchRename4() {
    focusActorAssetViaMouse(3);
    realPress("ArrowDown");
    chooseCcMenuItem(2);
    assertModalWithTitle("Rename “solid-004.png”");
  }
});
