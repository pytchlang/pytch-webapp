/// <reference types="cypress" />

context("Interact with code editor", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  beforeEach(() => cy.pytchBuildCode("\nimport pytch\n"));
});
