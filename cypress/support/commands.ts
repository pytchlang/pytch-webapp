// Additional commands for testing Pytch.

Cypress.Commands.add("pytchResetDatabase", () => {
  cy.visit("http://localhost:3000/").then((window) => {
    window.indexedDB.deleteDatabase("pytch");
  });
});
