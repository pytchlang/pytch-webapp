import { ActivityBarTabKey } from "../../../src/model/junior/edit-state";
import {
  initSpecimenIntercepts,
  kFlatLessonUrl,
  kPerMethodLessonUrl,
} from "../utils";
import { assertFocus, KeyOrShortcut, kShiftTab, realPress } from "./utils";

const getTabButton = (tabKey: ActivityBarTabKey) =>
  cy.get(`button[data-activity-bar-tab="${tabKey}"]`);

context("Kbd-nav of activity bar", () => {
  it("can focus tabs and activate content", () => {
    cy.pytchProjectFollowingTutorial();

    getTabButton("helpsidebar").as("helpButton");
    getTabButton("tutorial").as("tutorialButton");
    cy.get("@helpButton").click();
    cy.get(".ActivityContent .HelpSidebar");
    assertFocus("help-sidebar", [0]);
    realPress(kShiftTab);
    cy.get("@helpButton").should("have.focus");

    cy.get("@tutorialButton").click();
    cy.get(".ActivityContent .Junior-LessonContent");
    assertFocus("tutorial-content");
    realPress(kShiftTab, 2);
    cy.get("@tutorialButton").should("have.focus");

    cy.get("@tutorialButton").click();
    cy.get(".ActivityContent").should("not.exist");
    cy.get("@tutorialButton").should("have.focus");

    cy.get("@helpButton").click();
    assertFocus("help-sidebar", [0]);
    realPress(kShiftTab);
    cy.get("@helpButton").should("have.focus");

    function assertFocusAfterKey(key: KeyOrShortcut, tab: ActivityBarTabKey) {
      realPress(key);
      assertFocus("activity-tab", tab);
    }

    assertFocusAfterKey("ArrowDown", "tutorial");
    assertFocusAfterKey("ArrowDown", "keynavhelp");
    assertFocusAfterKey("ArrowUp", "tutorial");
    assertFocusAfterKey("End", "i18n");
    assertFocusAfterKey("Home", "helpsidebar");
    assertFocusAfterKey("Home", "helpsidebar");
    assertFocusAfterKey("ArrowRight", "tutorial");
    assertFocusAfterKey("ArrowRight", "keynavhelp");
    assertFocusAfterKey("ArrowRight", "i18n");
    assertFocusAfterKey("ArrowLeft", "keynavhelp");
    assertFocusAfterKey("ArrowLeft", "tutorial");
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
    realPress(kShiftTab, 2);
    assertActivityAfterEnter(null);
    assertActivityAfterEnter("Junior-LessonContent");

    realPress(kShiftTab, 2);
    assertFocusAfterKey("ArrowUp", "helpsidebar");
    assertActivityAfterEnter("HelpSidebar");
    realPress(kShiftTab);
    assertActivityAfterEnter(null);
    assertActivityAfterEnter("HelpSidebar");

    realPress(kShiftTab);
    assertFocusAfterKey("End", "i18n");
    assertFocusAfterKey("ArrowLeft", "keynavhelp");
    assertActivityAfterEnter("KeyNavHelpSidebar");
    realPress(kShiftTab);
    assertActivityAfterEnter(null);
    assertActivityAfterEnter("KeyNavHelpSidebar");
  });

  type InitBookmarkSpecT = {
    label: string;
    setup: () => void;
    expInitialBookmark: ActivityBarTabKey;
  };
  const initBookmarkSpecs: Array<InitBookmarkSpecT> = [
    {
      label: "per-method bare",
      setup: () => {
        cy.pytchResetDatabase();
        cy.pytchTryUploadZipfiles(["eight-grey-costumes.zip"]);
      },
      expInitialBookmark: "helpsidebar",
    },
    {
      label: "per-method lesson",
      setup: () => {
        cy.pytchJrLesson();
      },
      expInitialBookmark: "lesson",
    },
    {
      label: "per-method specimen",
      setup: () => {
        initSpecimenIntercepts();
        cy.visit(kPerMethodLessonUrl);
        cy.get("div.specimen-name");
      },
      expInitialBookmark: "specimen",
    },
    {
      label: "flat bare",
      setup: () => {
        cy.pytchResetDatabase();
        cy.pytchTryUploadZipfiles(["print-things.zip"]);
      },
      expInitialBookmark: "helpsidebar",
    },
    {
      label: "flat tutorial",
      setup: () => {
        cy.pytchProjectFollowingTutorial();
      },
      expInitialBookmark: "tutorial",
    },
    {
      label: "flat specimen",
      setup: () => {
        initSpecimenIntercepts();
        cy.visit(kFlatLessonUrl);
        cy.get("div.specimen-name");
      },
      expInitialBookmark: "specimen",
    },
  ];
  initBookmarkSpecs.forEach((spec) =>
    it(`init bookmarked tab (${spec.label})`, () => {
      spec.setup();
      cy.get("main").focus();
      realPress("Tab");
      assertFocus("activity-tab", spec.expInitialBookmark);
    })
  );

  type FocusOnSelectSpec = {
    tab: ActivityBarTabKey;
    clickTwice?: boolean;
    setup: () => void;
    assertFocus: () => void;
  };
  const focusOnSelectSpecs: Array<FocusOnSelectSpec> = [
  ];
  context("focus content on tab select", () => {
    beforeEach(() => {
      cy.pytchResetDatabase();
    });
    focusOnSelectSpecs.forEach((spec) => {
      it(spec.tab, () => {
        spec.setup();
        getTabButton(spec.tab).click();
        if (spec.clickTwice ?? false) {
          getTabButton(spec.tab).click();
        }
        spec.assertFocus();
      });
    });
  });
});
