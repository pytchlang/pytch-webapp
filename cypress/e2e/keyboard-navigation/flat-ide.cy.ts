context("Flat code editing", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles(["print-things.zip"]);
  });
});
