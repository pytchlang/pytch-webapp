import {
  assertHatBlockLabels,
  assertScriptEventKind,
  eventHandlerCodeShouldEqual,
  focusScriptViaMouse,
  loadFromZipfile,
  ScriptOps,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";
import { assertModalWithTitle, assertNoModal } from "../utils";
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

  it("add then delete script", () => {
    realPress("Tab", 2);
    assertFocus("add-script-button");

    realPress("Space");
    assertModalWithTitle("Choose hat block");
    assertFocus("hat-block-option", 0);
    realPress("ArrowDown", 2);
    assertFocus("hat-block-option", 2);
    realPress("Enter");
    assertPluckedLabels([0, 1, 2, 3, 2]);
    assertFocus("script-code", 4);

    chooseCcMenuItem("End");
    realPress("Tab");
    realPress("Enter");
    assertNoModal();
    assertPluckedLabels([0, 1, 2, 3]);
  });

  it("hat-block upsert inits with correct focus", () => {
    function assertFocusThenCxlModal(expOptionIndex: number) {
      assertFocus("hat-block-option", expOptionIndex);
      realPress("Escape");
      assertNoModal();
    }

    const expOptionIndexes = [0, 4, 2, 1];
    expOptionIndexes.forEach((expOptionIdx, scriptIdx) => {
      realPress(scriptIdx === 0 ? "Tab" : "ArrowDown");
      assertFocus("script", scriptIdx);
      chooseCcMenuItem(0);
      assertFocusThenCxlModal(expOptionIdx);
      realPress("Tab"); // Add script
      realPress("Enter");
      assertFocusThenCxlModal(expOptionIdx);
      // Focus goes back to previously-highlighted script.
    });
  });

  it("change hat block", () => {
    realPress("Tab");
    realPress("ArrowDown");
    assertFocus("script", 1);
    chooseCcMenuItem(0);
    assertModalWithTitle("Choose hat block");
    assertFocus("hat-block-option", 4);
    realPress("ArrowUp", 2);
    realPress("Enter");
    assertNoModal();
    assertFocus("script", 1);
    assertScriptEventKind(1, "start-as-clone");
  });

  it("cancel change hat block", () => {
    realPress("Tab");
    realPress("ArrowDown", 2);
    assertFocus("script", 2);
    chooseCcMenuItem(0);
    assertModalWithTitle("Choose hat block");
    realPress("Escape");
    assertNoModal();
    assertFocus("script", 2);
  });

  [
    { label: "esc", keys: ["Escape"] as const },
    { label: "btn via space", keys: ["Home", "Tab", "Space"] as const },
    { label: "btn via enter", keys: ["Home", "Tab", "Enter"] as const },
  ].forEach((spec) =>
    it(`cancel add script (${spec.label})`, () => {
      ScriptOps.launchAddHandler();
      assertFocus("hat-block-option", 0);
      spec.keys.forEach((k) => realPress(k));
      assertFocus("script", 0);
    })
  );
});
