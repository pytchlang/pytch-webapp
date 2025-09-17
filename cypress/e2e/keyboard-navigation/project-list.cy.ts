context("My projects list", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles([
      "per-method-four-scripts.zip",
      "eight-grey-costumes.zip",
    ]);
  });
});
