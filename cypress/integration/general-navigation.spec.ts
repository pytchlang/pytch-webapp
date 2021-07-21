/// <reference types="cypress" />

context("General site navigation", () => {
  it("handles unknown pages within app", () => {
    cy.visit("/no-such-route-blah-blah");
    cy.contains("Sorry, we could not find that page");
    cy.contains("Pytch homepage").click();
    cy.contains("Pytch is a bridge");
  });
});
