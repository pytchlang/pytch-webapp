/// <reference types="cypress" />

context("Make copy of project", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });
});
