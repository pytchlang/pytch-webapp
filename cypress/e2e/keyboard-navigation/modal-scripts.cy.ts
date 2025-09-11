import {
  eventHandlerCodeShouldEqual,
  focusScriptViaMouse,
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";
import { assertFocus, kShiftTab, realPress } from "./utils";

context("Working with scripts", () => {
  beforeEach(() => {
    loadFromZipfile("per-method-four-scripts.zip");
    selectSprite("Snake");
    selectActorAspect("Code", "tab");
    assertFocus("actor-property-tab", "code");
  });

  it("navigate with kbd and mouse", () => {
    realPress("Tab");
    assertFocus("script", 0);

    realPress("ArrowDown");
    assertFocus("script", 1);

    realPress("Enter");
    assertFocus("script-code", 1);

    cy.realType("# hello");
    eventHandlerCodeShouldEqual(1, "# hello");

    realPress("Escape");
    assertFocus("script", 1);

    realPress(kShiftTab);
    assertFocus("actor-property-tab", "code");

    realPress("Tab");
    assertFocus("script", 1);

    realPress("Tab");
    assertFocus("add-script-button");

    realPress(kShiftTab);
    assertFocus("script", 1);

    realPress("End");
    assertFocus("script", 3);

    focusScriptViaMouse(1);
    assertFocus("script-code", 1);
    realPress("Escape");
    assertFocus("script", 1);

    realPress("Home");
    assertFocus("script", 0);

    focusScriptViaMouse(2);
    assertFocus("script-code", 2);
  });
});
