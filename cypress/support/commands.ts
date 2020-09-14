// Additional commands for testing Pytch.

Cypress.Commands.add("pytchResetDatabase", () => {
  cy.visit("http://localhost:3000/").then((window) => {
    window.indexedDB.deleteDatabase("pytch");
  });
});

Cypress.Commands.add("pytchExactlyOneProject", (projectName: string) => {
  cy.pytchResetDatabase();
  cy.contains("My projects").click();
  cy.contains("Create a new project").click();
  cy.get("input[type=text]").type(projectName);
  cy.get("button").contains("Create project").click();
  cy.contains(projectName).click();
  cy.contains("Images and sounds");
});
