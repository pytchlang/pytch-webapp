/// <reference types="cypress" />

context("Browser window title", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("home page after project", () => {
    cy.visit("/my-projects/");
    cy.title().should("eq", "Pytch: My projects");
    cy.pytchOpenProject("Test seed");

    // TODO: This should really be the name the user gave the project,
    // not an internal ID integer.
    cy.title().should("match", /Pytch: Project [0-9]+/);

    cy.pytchHomeFromIDE();
    cy.title().should("eq", "Pytch");
  });
});
