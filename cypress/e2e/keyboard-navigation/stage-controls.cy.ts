import { assertFocus, kShiftTab, realPress } from "./utils";

context("Stage controls", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles(["four-empty-sprites.zip"]);
  });

  it("work with coords chooser", () => {
    cy.pytchGreenFlag();
    assertFocus("stage");
    realPress(kShiftTab);
    assertFocus("stage-controls-dropdown", "collapsed");
    realPress("Space");
    assertFocus("stage-controls-dropdown-entry", "my-projects");

    realPress("ArrowDown", 5);
    assertFocus("stage-controls-dropdown-entry", "show-coords");

    realPress("Space");
    assertFocus("coords-chooser-overlay");
    realPress("Tab", 2);
    assertFocus("actor-card", 0);
    realPress(kShiftTab, 2);
    assertFocus("coords-chooser-overlay");
    realPress("Escape");
    cy.get("div.CoordinateChooserOverlay").should("not.exist");
    assertFocus("stage");
  });

  it("supports menu movement keys", () => {
    cy.pytchGreenFlag();
    realPress(kShiftTab);
    assertFocus("stage-controls-dropdown", "collapsed");
    cy.focused()
      .should("have.attr", "aria-haspopup", "true")
      .should("have.attr", "aria-label", "More options");

    realPress("Space");
    assertFocus("stage-controls-dropdown-entry", "my-projects");

    const expFocusAfterKey = [
      ["End", "show-tooltips"],
      ["ArrowDown", "show-tooltips"],
      ["Home", "my-projects"],
      ["ArrowUp", "my-projects"],
      ["PageDown", "show-coords"],
      ["PageUp", "my-projects"],
    ] as const;
    expFocusAfterKey.forEach(([key, expItemId]) => {
      realPress(key);
      assertFocus("stage-controls-dropdown-entry", expItemId);
    });
  });
});
