import {
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";
import { assertFocus, chooseCcMenuItem, kShiftTab, realPress } from "./utils";

context("Navigating actor properties", () => {
  beforeEach(() => {
    loadFromZipfile("per-method-four-scripts.zip");
    selectSprite("Snake");
  });

  it("select property via tabs", () => {
    selectActorAspect("Code");
    assertFocus("actor-property-tab", "code");
    realPress("ArrowRight", 2);
    cy.get(".NoContentHelp").contains("Your sprite has no Sounds");
    realPress("ArrowLeft");
    realPress("Tab");
    assertFocus("appearance-card", 0);
    realPress("Tab");
    assertFocus("add-appearance-button");
    realPress(kShiftTab, 2);
    assertFocus("actor-property-tab", "appearances");
    realPress("ArrowLeft");
    assertFocus("actor-property-tab", "code");
    realPress(kShiftTab);
    assertFocus("help-sidebar", [0]);
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
