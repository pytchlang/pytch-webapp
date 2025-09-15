import { assertFocus, kShiftTab, realPress } from "./utils";

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
});
