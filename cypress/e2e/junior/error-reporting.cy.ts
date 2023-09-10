context("Interact with errors", () => {
  beforeEach(() => {
    // Initial ** is to match the fetched URL both when running
    // development server and when serving a deployment zipfile.
    cy.intercept("GET", "**/cypress/simple-pytchjr-project.zip", {
      fixture: "project-zipfiles/simple-pytchjr-project.zip",
    });
    cy.pytchResetDatabase({
      initialUrl: "/suggested-demo/cypress/simple-pytchjr-project",
    });
    cy.get("button").contains("Demo").click();
    cy.pytchGreenFlag();
  });
});
