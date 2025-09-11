import {
  assertHatBlockLabels,
  eventHandlerCodeShouldEqual,
  focusScriptViaMouse,
  loadFromZipfile,
  ScriptOps,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";
import { assertFocus, chooseCcMenuItem, kShiftTab, realPress } from "./utils";

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

  const assertPluckedLabels = (idxs: Array<number>) =>
    assertHatBlockLabels(
      idxs.map((i) => ScriptOps.allExtendedHandlerLabels[i])
    );

  it("can perform ccmenu actions", () => {
    realPress("Tab");
    realPress("ArrowDown", 2);
    assertFocus("script", 2);

    chooseCcMenuItem(3); /* Duplicate script */
    assertFocus("script-code", 3);
    assertPluckedLabels([0, 1, 2, 2, 3]);

    realPress("Escape");
    assertFocus("script", 3);

    chooseCcMenuItem("End"); /* DELETE */
    realPress("Tab"); /* OK button */
    realPress("Space");
    assertFocus("script", 3);
    assertPluckedLabels([0, 1, 2, 3]);

    realPress("ArrowUp");
    chooseCcMenuItem("End"); /* DELETE */
    realPress("Tab"); /* OK button */
    realPress("Space");
    assertFocus("script", 2);
    assertPluckedLabels([0, 1, 3]);

    chooseCcMenuItem(1); /* Move script up */
    assertFocus("script", 1);
    assertPluckedLabels([0, 3, 1]);

    chooseCcMenuItem(1); /* Move script up */
    assertFocus("script", 0);
    assertPluckedLabels([3, 0, 1]);

    realPress("ArrowDown");
    chooseCcMenuItem(2); /* Move script down */
    assertFocus("script", 2);
    assertPluckedLabels([3, 1, 0]);

    realPress("Home");
    assertFocus("script", 0);
    chooseCcMenuItem(0); /* Change hat block */
    realPress("ArrowDown", 1); /* clicked -> start as clone */
    realPress("Enter");
    assertFocus("script", 0);
    assertPluckedLabels([2, 1, 0]); /* fudge: re-use starting label [2] */
  });
});
