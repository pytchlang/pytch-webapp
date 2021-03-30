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

  it("can upload valid zipfile", () => {
    tryUploadZipfile("hello-world.zip");
    // Project creation should have succeeded, meaning we can see this tab:
    cy.contains("Images and sounds");
    cy.pytchCodeTextShouldContain("valid test fixture zipfile");
    // Project should be listed in My Projects:
    cy.contains("MyStuff").click();
    cy.contains("Hello world");
    cy.contains("Created from zipfile");
  });
});
