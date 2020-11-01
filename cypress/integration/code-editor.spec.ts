/// <reference types="cypress" />

context("Interact with code editor", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  beforeEach(() => cy.pytchBuildCode("\nimport pytch\n"));

  it("auto-completes top-level pytch attributes", () => {
    cy.get("#pytch-ace-editor").type("pytch.y_is_pr{ctrl} ");

    // This feels quite fragile but is working for now:
    cy.get(".ace_autocomplete").click();

    cy.pytchCodeTextShouldContain("pytch.key_is_pressed");
  });

  it("auto-completes Actor methods", () => {
    cy.get("#pytch-ace-editor").type("self.sound_until{ctrl} ");
    cy.get(".ace_autocomplete").click();
    cy.pytchCodeTextShouldContain("self.play_sound_until_done");
  });

  it("keeps code content when changing layout", () => {
    cy.get("#pytch-ace-editor").type("# HELLO WORLD{enter}");
    cy.get(".layout-icon.tall-code").click();
    cy.get("button.tall-code.btn-primary");
    cy.pytchCodeTextShouldContain("HELLO WORLD");
    cy.get(".layout-icon.wide-info").click();
    cy.get("button.wide-info.btn-primary");
    cy.pytchCodeTextShouldContain("HELLO WORLD");
  });
});
