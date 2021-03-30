context("Upload project from zipfile", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.contains("My projects").click();
  });

  const tryUploadZipfile = (zipBasename: string) => {
    cy.contains("Upload project").click();
    cy.get(".form-control-file").attachFile(`project-zipfiles/${zipBasename}`);
    cy.get(".modal-footer").contains("Upload project").click();
  };
});
