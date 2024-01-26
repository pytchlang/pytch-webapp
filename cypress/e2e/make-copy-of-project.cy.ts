/// <reference types="cypress" />

import { blueColour } from "./crop-scale-constants";

context("Make copy of project", () => {
  it("copies a project", () => {
    cy.pytchExactlyOneProject();

    const expAssets = ["red-rectangle-80-60.png", "sine-1kHz-2s.mp3"];
    cy.pytchShouldShowAssets(expAssets);
    cy.pytchSetCodeWithDeIndent(`
        import pytch
        # Hello world!
        # Some comments to test copying
    `);
    cy.pytchCodeTextShouldContain("test copying");

    cy.pytchChooseDropdownEntry("Make a copy");
    cy.get('input[type="text"]').should("be.focused");
    cy.pytchSendKeysToApp("{selectAll}{del}Copy-of-project{enter}");

    cy.title().should("eq", "Pytch: Copy-of-project");
    cy.pytchShouldShowAssets(expAssets);
    cy.pytchCodeTextShouldContain("test copying");
    cy.pytchFocusEditor();
    cy.pytchSendKeysToApp("{control}{end}");
    cy.pytchSendKeysToApp("{enter}# Extra comment in copy{enter}");
    cy.contains("Save").click();

    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.pytchProjectNamesShouldDeepEqual([
      "Copy-of-project",
      "Test seed project",
    ]);

    cy.contains("Copy-of-project").click();
    cy.pytchShouldShowAssets(expAssets);
    cy.pytchCodeTextShouldContain("test copying");
    cy.pytchCodeTextShouldContain("Extra comment");

    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.contains("Test seed project").click();
    cy.pytchShouldShowAssets(expAssets);
    cy.pytchCodeTextShouldEqual(
      "import pytch\n" +
        "# Hello world!\n" +
        "# Some comments to test copying\n"
    );
  });

  it("copies asset transforms", () => {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles(["one-cropped-scaled-sprite.zip"]);
    cy.pytchChooseDropdownEntry("Make a copy");
    cy.get('input[type="text"]').should("be.focused");
    cy.pytchSendKeysToApp("{selectAll}{del}Copy-of-xfm-project{enter}");
    cy.title().should("eq", "Pytch: Copy-of-xfm-project");
    cy.pytchGreenFlag();
    cy.pytchStdoutShouldEqual("Hello world\n");
    cy.pytchCanvasShouldBeSolidColour(blueColour);
  });
});
