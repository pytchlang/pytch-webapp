import {
  focusProjectCardViaMouse,
} from "../utils";
import { assertFocus, kShiftTab, realPress } from "./utils";

context("My projects list", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles([
      "per-method-four-scripts.zip",
      "eight-grey-costumes.zip",
    ]);
  });

  it("navigate list", () => {
    focusProjectCardViaMouse(1);
    assertFocus("project-card", 1);
    realPress(kShiftTab);
    realPress("Tab");
    assertFocus("project-card", 1);

    realPress("ArrowDown");
    assertFocus("project-card", 2);

    focusProjectCardViaMouse(0, "select-toggle");
    assertFocus("project-card", 0);

    realPress("End");
    assertFocus("project-card", 2);
    realPress(kShiftTab);
    realPress("Tab");
    assertFocus("project-card", 2);

    realPress("Home");
    assertFocus("project-card", 0);
  });
});
