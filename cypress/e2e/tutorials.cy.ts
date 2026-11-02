/// <reference types="cypress" />

import {
  assertCopiedText,
  assertInIDE,
  jumpToTutorialChapter,
  launchShareTutorialModal,
  withDownloadedZipfile,
} from "./utils";
import { assertTwoStateSwitchState, settleModalDialog } from "./junior/utils";
import { LinkedFlatTutorialRef } from "../../src/model/flat-tutorial";

context("Work with tutorials list", () => {
  it("shows list of tutorials", () => {
    cy.visit("/");
    cy.pytchTutorialsFromHome();
    cy.contains("Boing");
    // Expect some "beginner" and some "advanced":
    cy.get(".tag-difficulty")
      .contains("beginner")
      .should("have.length.above", 0);
    cy.get(".tag-difficulty")
      .contains("advanced")
      .should("have.length.above", 0);
  });
});

context("Interact with a tutorial", () => {
  beforeEach(() => {
    cy.pytchProjectFollowingTutorial();
  });

  // This only works when the progress trail display does not include
  // the ⋯ markers for elided chapter nodes.
  const assertActiveChapterIndex = (expActiveIndex: number) => {
    cy.get(".ProgressTrail .progress-node-background.isActive").should(
      "have.length",
      1
    );
    const nChild = expActiveIndex + 1;
    const selector = `.ProgressTrail .progress-node-background:nth-child(${nChild})`;
    cy.get(selector).should("have.class", "isActive");
  };

  it("can navigate through tutorial", () => {
    cy.contains("Next: Make the playing area").click();
    assertActiveChapterIndex(1);
    cy.contains("Back: Boing").click();
    assertActiveChapterIndex(0);
    cy.contains("Next: Make the playing area").click();
    cy.contains("Next:").click();
    cy.contains("Next:").click();
    assertActiveChapterIndex(3);
  });

  it("remembers chapter when project re-opened", () => {
    jumpToTutorialChapter(3);
    assertActiveChapterIndex(3);
    // Visit a different project, so that the tutorial-following project
    // is loaded afresh from storage when we switch back to it.
    cy.pytchSwitchProject("Test seed project");
    cy.pytchSwitchProject('My "boing"');
    assertActiveChapterIndex(3);
  });

  it("records chapter in zipfile", () => {
    const assertChapterIndexInZip = (expChapterIndex: number) => {
      withDownloadedZipfile("click", async (fileFromZip) => {
        const meta = JSON.parse(await fileFromZip("meta.json").async("string"));
        const lcRef = meta.linkedContentRef as LinkedFlatTutorialRef;
        expect(lcRef.kind).equal("flat-tutorial");
        expect(lcRef.name).equal("boing");
        expect(lcRef.interactionState.chapterIndex).equal(expChapterIndex);
      });
    };

    assertChapterIndexInZip(0);
    jumpToTutorialChapter(2);
    assertActiveChapterIndex(2);
    assertChapterIndexInZip(2);
  });

  it("obeys keep-link setting when copying", () => {
    jumpToTutorialChapter(2);
    cy.pytchChooseDropdownEntry("Make a copy");
    assertTwoStateSwitchState("keep-content-link-switch", true);
    settleModalDialog("Make a copy");

    cy.title().should("match", /Pytch: Copy of/);
    assertActiveChapterIndex(2);

    // help-sidebar, tutorial, keynav-help-sidebar, language-choice
    cy.get(".ActivityBar li.ActivityBarTab").should("have.length", 4);
  });

  it("obeys sever-link setting when copying", () => {
    cy.pytchChooseDropdownEntry("Make a copy");
    cy.get(".TwoStateSwitch.keep-content-link-switch").click();
    assertTwoStateSwitchState("keep-content-link-switch", false);
    settleModalDialog("Make a copy");

    cy.title().should("match", /Pytch: Copy of/);
    cy.get(".ProgressTrail").should("not.exist");

    // help-sidebar, keynav-help-sidebar, language-choice
    cy.get(".ActivityBar li.ActivityBarTab").should("have.length", 3);
  });

  it("copies text when [+] label clicked", () => {
    cy.contains("Next: Make the playing area").click();
    cy.contains("Next: Add the player's bat").click();
    cy.get("tbody.diff-add span.add-or-del").eq(0).click();
    assertCopiedText(
      (text) =>
        text.includes("class PlayerBat") && text.includes("player-normal.png")
    );
  });
});

context("Scratchblocks rendering", () => {
  it("renders scratchblocks", () => {
    cy.pytchProjectFollowingTutorial("ticket-vending-machine");
    jumpToTutorialChapter(3);
    cy.get(".scratchblocks svg").contains("costume");
    jumpToTutorialChapter(5);
    cy.get(".scratchblocks svg").contains("sprite");
    jumpToTutorialChapter(6);
    cy.get(".scratchblocks svg").contains("variable");
  });
});

context("Demo of a tutorial", () => {
  beforeEach(() => {
    cy.pytchProjectDemonstratingTutorial();
  });

  it("creates project and launches IDE", () => {
    // help-sidebar, keynav-help-sidebar, language-choice
    cy.get(".ActivityBar .ActivityBarTab").should("have.length", 3);
    assertInIDE("flat");
  });

  it("launches button tour for demo", () => {
    cy.pytchRunThroughButtonTour();

    // Quick!  Before the ball hits the bat and makes a noise!
    cy.pytchRedStop();
  });

  it("dismisses button tour when project re-loaded", () => {
    cy.contains("Click the green flag");
    cy.pytchSwitchProject("This project is a demo");
    cy.get(".pytch-static-tooltip.hidden").should("have.length", 1);
    cy.get(".pytch-static-tooltip.shown").should("not.exist");
  });

  it("dismisses button tour when creating tutorial", () => {
    cy.contains("Click the green flag");
    cy.pytchHomeFromIDE();
    const createOptions = { resetDatabaseFirst: false };
    cy.pytchProjectFollowingTutorial("boing", createOptions);
    cy.get(".pytch-static-tooltip.hidden").should("have.length", 1);
    cy.get(".pytch-static-tooltip.shown").should("not.exist");
  });
});

context("Work with suggested tutorials", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
  });

  it("Shows suggested tutorial card (tutorial only)", () => {
    cy.visit("/suggested-tutorial/boing");
    cy.contains("Pong-like game");
    cy.get(".TutorialCard").should("have.length", 1);
  });

  it("Allows tutorial of suggested project (tutorial only)", () => {
    cy.visit("/suggested-tutorial/boing");
    cy.contains("Pong-like game");
    cy.get("button[title*='Learn how to make']").click();
    cy.contains("Images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    cy.contains("Make a Pong-like game");
  });

  it("Handles non-existent suggested project (tutorial only)", () => {
    cy.visit("/suggested-tutorial/no-such-tutorial");
    cy.contains("Sorry");
    cy.contains("See all tutorials");
  });

  it("Allows tutorial of suggested project (tutorial and demo)", () => {
    cy.visit("/suggested-tutorial-demo/boing");
    cy.get("button[title*='Learn how to make']").click();
    cy.contains("Images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    cy.contains("Tutorial");
    cy.contains("class BoingBackground").should("not.exist");
  });

  it("Allows demo of suggested project (tutorial and demo)", () => {
    cy.visit("/suggested-tutorial-demo/boing");
    cy.contains("Demo").click();
    cy.contains("Images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    cy.contains("class BoingBackground");
    cy.contains("Tutorial").should("not.exist");
  });

  it("Handles non-existent suggested project (tutorial and demo)", () => {
    cy.visit("/suggested-tutorial/no-such-tutorial");
    cy.contains("Sorry");
    cy.contains("See all tutorials");
  });

  it("Has working see-all-tutorials button", () => {
    cy.visit("/suggested-tutorial/boing");
    cy.contains("See all tutorials").click();
    cy.contains("Frogger-like game");
  });
});

context("Tutorial share feature", () => {
  it("Allows user to copy links", () => {
    cy.visit("/tutorials");
    launchShareTutorialModal("bunner");
    cy.get(".modal-title").contains("Frogger-like");
    cy.get("button[title*='only']").click();
    assertCopiedText((text) => text.endsWith("suggested-tutorial/bunner"));
  });
});
