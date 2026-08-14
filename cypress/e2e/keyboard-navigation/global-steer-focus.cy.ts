import { selectActorAspect, selectSprite, selectStage } from "../junior/utils";
import { assertInIDE } from "../utils";
import {
  activateFlatAsset,
  assertFocus,
  invokeFocusShortcut,
  realPress,
} from "./utils";

context("Global focus steering shortcuts", () => {
  // These tests are a bit scrappy, ad-hoc, and near-duplicative, but it
  // didn't quite seem worth the trouble to try to factor out the common
  // behaviour.

  beforeEach(() => {
    cy.pytchResetDatabase();
  });

  context("flat IDE", () => {
    it("specimen link", () => {
      cy.intercept("GET", "**/_by_content_hash_/1234.zip", {
        fixture: "lesson-specimens/hello-world-lesson.zip",
      });
      cy.pytchTryUploadZipfiles(["v4-flat-linked-to-specimen.zip"]);
      assertInIDE("flat");

      cy.get('button[data-activity-bar-tab="helpsidebar"]').click();
      realPress("ArrowDown");
      realPress("Enter");

      invokeFocusShortcut("c");
      assertFocus("flat-code-editor");
      realPress("Escape");

      invokeFocusShortcut("h");
      assertFocus("specimen-info");
    });

    it("tutorial link", () => {
      cy.pytchProjectFollowingTutorial();
      assertInIDE("flat");
      activateFlatAsset(0);

      invokeFocusShortcut("h");
      assertFocus("tutorial-content");

      invokeFocusShortcut("a");
      assertFocus("flat-asset", 0);
      realPress("ArrowDown", 4);
      assertFocus("flat-asset", 4);

      invokeFocusShortcut("h");
      assertFocus("tutorial-content");

      cy.get('button[data-activity-bar-tab="helpsidebar"]')
        .as("helpButton")
        .click();

      invokeFocusShortcut("h");
      assertFocus("help-sidebar", [0]);

      realPress("ArrowDown", 3);
      realPress("Enter");
      realPress("ArrowDown", 3);
      assertFocus("help-sidebar", [3, 2]);

      invokeFocusShortcut("a");
      assertFocus("flat-asset", 4);

      invokeFocusShortcut("h");
      assertFocus("help-sidebar", [3, 2]);

      cy.get("@helpButton").click();
      invokeFocusShortcut("c");
      assertFocus("flat-code-editor");
      realPress("Escape");
      invokeFocusShortcut("h");
      assertFocus("activity-tab", "helpsidebar");

      realPress("End");
      assertFocus("activity-tab", "i18n");
      invokeFocusShortcut("a");
      assertFocus("flat-asset", 4);
      invokeFocusShortcut("h");
      assertFocus("activity-tab", "i18n");

      realPress("ArrowUp");
      realPress("Enter");
      realPress("Tab");
      assertFocus("keynav-help");

      invokeFocusShortcut("a");
      assertFocus("flat-asset", 4);
      invokeFocusShortcut("h");
      assertFocus("keynav-help");
    });
  });

  context("per-method IDE", () => {
    it("specimen link", () => {
      cy.intercept("GET", "**/_by_content_hash_/1234.zip", {
        fixture: "lesson-specimens/per-method-blue-invaders.zip",
      });
      cy.pytchTryUploadZipfiles(["v4-jr-linked-to-specimen.zip"]);
      assertInIDE("per-method");

      selectStage();
      assertFocus("actor-card", 0);

      cy.get('button[data-activity-bar-tab="helpsidebar"]').click();
      realPress("ArrowDown");
      realPress("Enter");

      invokeFocusShortcut("h");
      assertFocus("specimen-info");

      invokeFocusShortcut("c");
      assertFocus("add-script-button");

      invokeFocusShortcut("h");
      assertFocus("specimen-info");
    });

    it("multiple costumes", () => {
      cy.pytchTryUploadZipfiles(["pytch-jr-5-costumes-4-sounds.zip"]);
      assertInIDE("per-method");

      selectSprite("Snake");
      selectActorAspect("Sounds");

      invokeFocusShortcut("c");
      assertFocus("sound-card", 0);
      realPress("ArrowDown", 2);
      assertFocus("sound-card", 2);

      invokeFocusShortcut("s");
      assertFocus("actor-card", 1);
      invokeFocusShortcut("c");
      assertFocus("sound-card", 2);

      selectActorAspect("Costumes");

      invokeFocusShortcut("c");
      assertFocus("appearance-card", 0);
      realPress("ArrowDown", 3);
      assertFocus("appearance-card", 3);

      invokeFocusShortcut("s");
      assertFocus("actor-card", 1);
      invokeFocusShortcut("c");
      assertFocus("appearance-card", 3);
    });

    it("tutorial link", () => {
      cy.pytchTryUploadZipfiles(["v4-jr-linked-to-tutorial.zip"]);
      assertInIDE("per-method");

      selectStage();
      assertFocus("actor-card", 0);
      realPress("ArrowRight");
      assertFocus("actor-card", 1);

      invokeFocusShortcut("h");
      assertFocus("tutorial-content");

      invokeFocusShortcut("c");
      assertFocus("add-script-button");

      invokeFocusShortcut("s");
      assertFocus("actor-card", 1);

      cy.get('button[data-activity-bar-tab="helpsidebar"]')
        .as("helpButton")
        .click();

      invokeFocusShortcut("h");
      assertFocus("help-sidebar", [0]);

      realPress("ArrowDown", 3);
      realPress("Enter");
      realPress("ArrowDown", 3);
      assertFocus("help-sidebar", [3, 2]);

      invokeFocusShortcut("s");
      assertFocus("actor-card", 1);

      invokeFocusShortcut("h");
      assertFocus("help-sidebar", [3, 2]);

      cy.get("@helpButton").click();
      invokeFocusShortcut("c");
      assertFocus("add-script-button");
      invokeFocusShortcut("h");
      assertFocus("activity-tab", "helpsidebar");

      realPress("End");
      assertFocus("activity-tab", "i18n");
      invokeFocusShortcut("c");
      assertFocus("add-script-button");
      invokeFocusShortcut("h");
      assertFocus("activity-tab", "i18n");

      realPress("ArrowUp");
      realPress("Enter");
      realPress("Tab");
      assertFocus("keynav-help");

      invokeFocusShortcut("c");
      assertFocus("add-script-button");
      invokeFocusShortcut("h");
      assertFocus("keynav-help");

      selectSprite("Snake");
      selectActorAspect("Costumes");
      invokeFocusShortcut("c");
      assertFocus("appearance-card", 0);

      selectActorAspect("Code");
      invokeFocusShortcut("h");
      assertFocus("keynav-help");
      invokeFocusShortcut("c");
      assertFocus("script", 0);

      selectActorAspect("Sounds");
      invokeFocusShortcut("h");
      assertFocus("keynav-help");
      invokeFocusShortcut("c");
      assertFocus("add-sound-button");
    });
  });
});
