/// <reference types="cypress" />

context("Python 3 features", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });
});
