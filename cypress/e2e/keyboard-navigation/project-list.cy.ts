import {
  assertInIDE,
  assertModalWithTitle,
  assertNoModal,
  focusProjectCardViaMouse,
} from "../utils";
import { assertFocus, chooseCcMenuItem, kShiftTab, realPress } from "./utils";

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

  it("open project (ccmenu)", () => {
    focusProjectCardViaMouse(2);
    assertFocus("project-card", 2);
    chooseCcMenuItem(0);
    assertInIDE("flat");
  });

  function launchRename() {
    focusProjectCardViaMouse(2);
    chooseCcMenuItem(1);
    assertModalWithTitle("Rename project “Test seed project”");
  }
  it("cxl rename", () => {
    launchRename();
    realPress("Escape");
    assertNoModal();
    assertFocus("project-card", 2);
  });
  it("do rename", () => {
    launchRename();
    assertFocus("project-new-name-input");
    realPress(["Control", "a"]);
    realPress("Delete");
    cy.realType("HW");
    realPress("Enter");
    assertNoModal();

    // Renaming is a modification; focus should be on the same project
    // but now at the top of the list.
    assertFocus("project-card", 0);
    cy.pytchProjectNamesShouldDeepEqual([
      "HW",
      "Some images",
      "Untitled project",
    ]);
  });

  function launchDelete(projectIdx: number) {
    focusProjectCardViaMouse(projectIdx);
    chooseCcMenuItem(2);
    assertModalWithTitle("Delete project?");
  }
  it("cxl delete", () => {
    launchDelete(2);
    realPress("Escape");
    assertNoModal();
    assertFocus("project-card", 2);
  });
  it("do delete", () => {
    launchDelete(1);
    realPress("Tab");
    realPress("Enter");
    assertNoModal();
    assertFocus("project-card", 1);
    cy.pytchProjectNamesShouldDeepEqual(["Some images", "Test seed project"]);
    realPress("ArrowUp");
    assertFocus("project-card", 0);
    realPress("ArrowDown");
    assertFocus("project-card", 1);

    launchDelete(1);
    realPress("Tab");
    realPress("Enter");
    assertNoModal();
    assertFocus("project-card", 0);

    launchDelete(0);
    realPress("Tab");
    realPress("Enter");
    assertNoModal();
    assertFocus("add-project-button");
  });
});
