import { assertFocus, chooseCcMenuItem, kShiftTab, realPress } from "./utils";
import {
  assertCopiedText,
} from "../utils";

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
  });
});
