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
    assertFocus("stage-controls-dropdown", "expanded");

    // The "Export to Google Drive" option can be disabled.  Press
    // "down" enough times to get to the bottom, then "up" once to get
    // to the item we want.
    realPress("ArrowDown", 10);
    realPress("ArrowUp");
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
});
