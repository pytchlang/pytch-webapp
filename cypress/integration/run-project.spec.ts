/// <reference types="cypress" />

context("Build and run projects", () => {
  before(() => {
    cy.visit("http://localhost:3000/").then((window) => {
      window.indexedDB.deleteDatabase("pytch");
    });
    cy.contains("My projects").click();
    cy.contains("Create a new project").click();
    cy.get("input[type=text]").type("Test project");
    cy.get("button").contains("Create project").click();
    cy.contains("Test project").click();
    cy.contains("Images and sounds");
  });
});
