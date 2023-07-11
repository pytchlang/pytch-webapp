/// <reference types="cypress" />

context("Work with suggested demos", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
  });

  // TODO: Set PYTCH_CYPRESS.instantDelays for these tests:

  it("Launch a suggested demo", () => {
    cy.visit("/suggested-demo/fake-build-id-for-tests/bubbles");
    cy.contains("Bubbles");
    cy.get("button[title*='Try this project']").click();
    cy.contains("images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    cy.contains("Click the green flag");
  });

  it("Give error if no such demo", () => {
    cy.visit("/suggested-demo/fake-build-id-for-tests/does-not-exist");
    cy.contains("Problem");
    cy.contains("Sorry");
  });
});
