import { loadFromZipfile, selectSprite } from "../junior/utils";
import { assertFocus, chooseCcMenuItem, kShiftTab, realPress } from "./utils";

context("Navigating actor properties", () => {
  beforeEach(() => {
    loadFromZipfile("per-method-four-scripts.zip");
    selectSprite("Snake");
  });

  it("remember which script is active", () => {
    chooseCcMenuItem(0); // "Go to code"
    assertFocus("script", 0);
    realPress("ArrowDown", 2);
    assertFocus("script", 2);

    selectSprite("Snake");
    chooseCcMenuItem(1); // "Go to costumes"
    assertFocus("appearance-card", 0);

    selectSprite("Snake");
    chooseCcMenuItem(0); // "Go to code"
    assertFocus("script", 2);

    selectSprite("Snake");
    chooseCcMenuItem(2); // "Go to sounds"
    assertFocus("add-sound-button");

    selectSprite("Snake");
    chooseCcMenuItem(0); // "Go to code"
    assertFocus("script", 2);

    realPress(kShiftTab, 2);
    assertFocus("help-sidebar", [0]);

    realPress("Tab", 2);
    assertFocus("script", 2);
  });
});
