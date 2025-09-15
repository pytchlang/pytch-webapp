import { ActivityBarTabKey } from "../../../src/model/junior/edit-state";
import { assertFocus, KeyOrShortcut, realPress } from "./utils";

context("Kbd-nav of activity bar", () => {
  it("can focus tabs and activate content", () => {
    cy.pytchProjectFollowingTutorial();

    cy.get('button[data-activity-bar-tab="helpsidebar"]').as("helpButton");
    cy.get('button[data-activity-bar-tab="tutorial"]').as("tutorialButton");
    cy.get("@helpButton").click();
    cy.get(".ActivityContent .HelpSidebar");
    cy.get("@helpButton").should("have.focus");

    cy.get("@tutorialButton").click();
    cy.get(".ActivityContent .Junior-LessonContent");
    cy.get("@tutorialButton").should("have.focus");

    cy.get("@tutorialButton").click();
    cy.get(".ActivityContent").should("not.exist");
    cy.get("@tutorialButton").should("have.focus");

    cy.get("@helpButton").click();
    cy.get("@helpButton").should("have.focus");

    function assertFocusAfterKey(key: KeyOrShortcut, tab: ActivityBarTabKey) {
      realPress(key);
      assertFocus("activity-tab", tab);
    }

    assertFocusAfterKey("ArrowDown", "tutorial");
    assertFocusAfterKey("ArrowDown", "tutorial");
    assertFocusAfterKey("ArrowUp", "helpsidebar");
    assertFocusAfterKey("End", "tutorial");
    assertFocusAfterKey("Home", "helpsidebar");
    assertFocusAfterKey("Home", "helpsidebar");
    assertFocusAfterKey("ArrowRight", "tutorial");
    assertFocusAfterKey("ArrowRight", "tutorial");
    assertFocusAfterKey("ArrowLeft", "helpsidebar");
    assertFocusAfterKey("ArrowLeft", "helpsidebar");
    assertFocusAfterKey("ArrowRight", "tutorial");

    function assertActivityAfterEnter(mContentClass: string | null) {
      realPress("Enter");
      if (mContentClass == null) {
        cy.get(".ActivityContent").should("not.exist");
      } else {
        cy.get(`.ActivityContent .${mContentClass}`);
      }
    }

    assertActivityAfterEnter("Junior-LessonContent");
    assertActivityAfterEnter(null);
    assertActivityAfterEnter("Junior-LessonContent");
    assertFocusAfterKey("ArrowUp", "helpsidebar");
    assertActivityAfterEnter("HelpSidebar");
    assertActivityAfterEnter(null);
    assertActivityAfterEnter("HelpSidebar");
  });

  type InitBookmarkSpecT = {
    label: string;
    setup: () => void;
    expInitialBookmark: ActivityBarTabKey;
  };
  const initBookmarkSpecs: Array<InitBookmarkSpecT> = [
    // TODO
  ];
  initBookmarkSpecs.forEach((spec) =>
    it.only(`init bookmarked tab (${spec.label})`, () => {
      spec.setup();
      cy.get("main").focus();
      realPress("Tab");
      assertFocus("activity-tab", spec.expInitialBookmark);
    })
  );
});
