import {
  assertFocus,
  chooseCcMenuItem,
  kShiftTab,
  realPress,
} from "./utils";
import {
  assertCopiedText,
  assertModalWithTitle,
  assertNoModal,
} from "../utils";
import { settleModalDialog } from "../junior/utils";

context("Flat code editing", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles(["print-things.zip"]);
  });

  it("no tab-trap in code editor", () => {
    cy.get("#pytch-ace-editor").click();
    cy.realType("\n# 236-6132");
    cy.pytchCodeTextShouldContain("236-6132");
    realPress("Escape");
    assertFocus("flat-code-tab");
    realPress(kShiftTab);
    assertFocus("help-sidebar", [0]);
  });

  context("asset ccmenu operations", () => {
    beforeEach(() => {
      cy.get(".AssetCardPane-container ul li button").click();
      realPress("Tab");
      assertFocus("flat-asset", 0);
    });

    it("copy name", () => {
      chooseCcMenuItem(0);
      assertCopiedText("'python-logo.png'");
      assertFocus("flat-asset", 0);
    });

    it("crop/scale", () => {
      chooseCcMenuItem(1);
      assertModalWithTitle("Adjust image");
      realPress("Tab", 3); // To "Cancel"
      realPress("Enter");
      assertNoModal();
      assertFocus("flat-asset", 0);
    });

    const assertRenameModal = () => {
      assertModalWithTitle("Rename “python-logo.png”");
    };
    it("cxl rename", () => {
      chooseCcMenuItem(2);
      assertRenameModal();
      settleModalDialog("Cancel");
      assertFocus("flat-asset", 0);
    });
    it("do rename", () => {
      chooseCcMenuItem(2);
      assertRenameModal();
      realPress(["Control", "a"]);
      cy.realType("logo123");
      settleModalDialog("Rename");
      assertFocus("flat-asset", 0);
      cy.pytchShouldShowAssets(["logo123.png"]);
    });

    const assertDeleteModal = () => {
      assertModalWithTitle(
        "Delete the image “python-logo.png” from your project?"
      );
    };
    it("cxl delete", () => {
      chooseCcMenuItem(3);
      assertDeleteModal();
      realPress("Enter");
      assertFocus("flat-asset", 0);
      cy.pytchShouldShowAssets(["python-logo.png"]);
    });
    it("do delete", () => {
      chooseCcMenuItem(3);
      assertDeleteModal();
      realPress("Tab");
      realPress("Enter");
      assertFocus("add-flat-asset-button");
      cy.pytchShouldShowAssets([]);
    });
  });
});
