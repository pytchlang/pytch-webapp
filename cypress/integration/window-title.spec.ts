/// <reference types="cypress" />

context("Browser window title", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("home page after project", () => {
    cy.visit("/my-projects/");
    cy.pytchOpenProject("Test seed");
    cy.pytchHomeFromIDE();
    cy.title().should("eq", "Pytch");
  });
});
