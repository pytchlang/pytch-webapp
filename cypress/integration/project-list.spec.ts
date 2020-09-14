/// <reference types="cypress" />

context("Management of project list", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/").then((window) => {
      window.indexedDB.deleteDatabase("pytch");
    });
    cy.contains("My projects").click();
    cy.location("pathname").should("include", "projects");
  });
});
