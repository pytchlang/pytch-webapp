/// <reference types="cypress" />

context("Management of project list", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/").then((window) => {
      window.indexedDB.deleteDatabase("pytch");
    });
    cy.contains("My projects").click();
    cy.location("pathname").should("include", "projects");
  });

  const createProject = (name: string) => {
    cy.contains("Create a new project").click();
    cy.get("input[type=text]").type(name);
    cy.get("button").contains("Create project").click();
    cy.contains("My projects");
    cy.contains(name);
  };
});
