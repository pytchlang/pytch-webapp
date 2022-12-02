/// <reference types="cypress" />

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
      "Test seed project",
      "Copy-of-project",
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
});
